import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { prisma } from "@/lib/prisma"
import { router, protectedProcedure } from "./server"

export const commentRouter = router({
  list: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ ctx, input }) => {
      const comments = await prisma.comment.findMany({
        where: { taskId: input.taskId },
        include: {
          author: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: "asc" },
      })
      return { comments }
    }),

  create: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1),
        taskId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await prisma.comment.create({
        data: {
          content: input.content,
          taskId: input.taskId,
          authorId: ctx.session.user.id,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      })

      // Notify task assignees (except comment author)
      const task = await prisma.task.findUnique({
        where: { id: input.taskId },
        include: {
          assignees: { include: { member: { select: { userId: true } } } },
        },
      })
      if (task) {
        const notifyUserIds = task.assignees
          .map((a) => a.member.userId)
          .filter((id) => id !== ctx.session.user.id)
        if (notifyUserIds.length > 0) {
          await prisma.notification.createMany({
            data: notifyUserIds.map((userId) => ({
              type: "comment_added",
              title: `New comment on "${task.title}"`,
              body: `${ctx.session.user.name}: ${input.content.slice(0, 100)}`,
              userId,
              organizationId: task.organizationId,
              taskId: task.id,
            })),
          })
        }
      }

      return { comment }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.comment.findUnique({
        where: { id: input.id },
      })
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" })
      if (existing.authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }
      await prisma.comment.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
