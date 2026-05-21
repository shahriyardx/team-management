import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { prisma } from "@/lib/prisma"
import { router, protectedProcedure } from "./server"

const assigneesInclude = {
  include: {
    member: {
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    },
  },
} as const

async function createNotifications(
  userIds: string[],
  type: string,
  title: string,
  body: string | undefined,
  organizationId: string,
  taskId: string | undefined,
) {
  if (userIds.length === 0) return
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      type,
      title,
      body,
      userId,
      organizationId,
      taskId,
    })),
  })
}

export const taskRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        skip: z.number().int().min(0).default(0),
        take: z.number().int().min(1).max(100).default(25),
      }),
    )
    .query(async ({ ctx, input }) => {
      const member = await prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId: ctx.session.user.id,
          },
        },
      })
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      const [tasks, total] = await prisma.$transaction([
        prisma.task.findMany({
          where: { organizationId: input.organizationId },
          include: {
            assignees: assigneesInclude,
            createdBy: { select: { id: true, name: true, email: true, image: true } },
            labels: { include: { label: true } },
          },
          orderBy: { createdAt: "asc" },
          skip: input.skip,
          take: input.take,
        }),
        prisma.task.count({ where: { organizationId: input.organizationId } }),
      ])

      return { tasks, total }
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().nullable().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        dueDate: z.string().nullable().optional(),
        assigneeIds: z.array(z.string()).optional(),
        labelIds: z.array(z.string()).optional(),
        organizationId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const member = await prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId: ctx.session.user.id,
          },
        },
      })
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      // Validate all assignees belong to this org
      if (input.assigneeIds?.length) {
        const assigneeCount = await prisma.member.count({
          where: { id: { in: input.assigneeIds }, organizationId: input.organizationId },
        })
        if (assigneeCount !== input.assigneeIds.length) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid assignee" })
        }
      }

      const task = await prisma.task.create({
        data: {
          title: input.title,
          description: input.description ?? null,
          status: input.status ?? "todo",
          priority: input.priority ?? "medium",
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          createdById: ctx.session.user.id,
          organizationId: input.organizationId,
          ...(input.assigneeIds?.length
            ? { assignees: { create: input.assigneeIds.map((memberId) => ({ memberId })) } }
            : {}),
          ...(input.labelIds?.length
            ? { labels: { create: input.labelIds.map((labelId) => ({ labelId })) } }
            : {}),
        },
        include: {
          assignees: assigneesInclude,
          createdBy: { select: { id: true, name: true, email: true, image: true } },
          labels: { include: { label: true } },
        },
      })

      // Notify assignees
      if (input.assigneeIds?.length) {
        const assigneeUsers = await prisma.member.findMany({
          where: { id: { in: input.assigneeIds } },
          select: { userId: true },
        })
        const notifyUserIds = assigneeUsers
          .map((m) => m.userId)
          .filter((id) => id !== ctx.session.user.id)
        await createNotifications(
          notifyUserIds,
          "task_assigned",
          `You were assigned: ${task.title}`,
          undefined,
          input.organizationId,
          task.id,
        )
      }

      return { task }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().nullable().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        dueDate: z.string().nullable().optional(),
        assigneeIds: z.array(z.string()).optional(),
        labelIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.task.findUnique({ where: { id: input.id } })
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" })

      const member = await prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: existing.organizationId,
            userId: ctx.session.user.id,
          },
        },
      })
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      // If updating labels, replace
      if (input.labelIds !== undefined) {
        await prisma.taskLabel.deleteMany({ where: { taskId: input.id } })
        if (input.labelIds.length > 0) {
          await prisma.taskLabel.createMany({
            data: input.labelIds.map((labelId) => ({ taskId: input.id, labelId })),
          })
        }
      }

      // If updating assignees, validate and replace
      if (input.assigneeIds !== undefined) {
        if (input.assigneeIds.length > 0) {
          const assigneeCount = await prisma.member.count({
            where: { id: { in: input.assigneeIds }, organizationId: existing.organizationId },
          })
          if (assigneeCount !== input.assigneeIds.length) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid assignee" })
          }
        }

        await prisma.taskAssignee.deleteMany({ where: { taskId: input.id } })
        if (input.assigneeIds.length > 0) {
          await prisma.taskAssignee.createMany({
            data: input.assigneeIds.map((memberId) => ({ taskId: input.id, memberId })),
          })
        }
      }

      const task = await prisma.task.update({
        where: { id: input.id },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.status !== undefined && { status: input.status }),
          ...(input.priority !== undefined && { priority: input.priority }),
          ...(input.dueDate !== undefined && { dueDate: input.dueDate ? new Date(input.dueDate) : null }),
        },
        include: {
          assignees: assigneesInclude,
          createdBy: { select: { id: true, name: true, email: true, image: true } },
          labels: { include: { label: true } },
        },
      })

      // Notify assignees on status change
      if (input.status !== undefined && task.assignees.length > 0) {
        const notifyUserIds = task.assignees
          .map((a) => a.member.user.id)
          .filter((id) => id !== ctx.session.user.id)
        await createNotifications(
          notifyUserIds,
          "status_changed",
          `Task "${task.title}" moved to ${input.status.replace("_", " ")}`,
          undefined,
          existing.organizationId,
          task.id,
        )
      }

      return { task }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.task.findUnique({ where: { id: input.id } })
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" })

      const member = await prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: existing.organizationId,
            userId: ctx.session.user.id,
          },
        },
      })
      if (!member || (member.role === "member" && existing.createdById !== ctx.session.user.id)) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }

      await prisma.task.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
