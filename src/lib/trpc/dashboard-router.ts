import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { prisma } from "@/lib/prisma"
import { router, protectedProcedure } from "./server"

export const dashboardRouter = router({
  orgStats: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const member = await prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId: ctx.session.user.id,
          },
        },
      })
      if (!member || (member.role !== "admin" && member.role !== "owner")) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }

      const [memberCount, cycleCount, taskCount] = await Promise.all([
        prisma.member.count({ where: { organizationId: input.organizationId } }),
        prisma.okrCycle.count({ where: { organizationId: input.organizationId } }),
        prisma.task.count({ where: { organizationId: input.organizationId } }),
      ])

      return { memberCount, cycleCount, taskCount }
    }),

  teamStats: protectedProcedure
    .input(z.object({ teamId: z.string(), organizationId: z.string() }))
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

      // Get team member IDs
      const teamMembers = await prisma.teamMember.findMany({
        where: { teamId: input.teamId },
        select: { userId: true },
      })
      const memberRecords = await prisma.member.findMany({
        where: { userId: { in: teamMembers.map((tm) => tm.userId) }, organizationId: input.organizationId },
        select: { id: true },
      })
      const memberIds = memberRecords.map((m) => m.id)

      // Find active cycle
      const activeCycle = await prisma.okrCycle.findFirst({
        where: { organizationId: input.organizationId, status: "active" },
      })

      let okrProgress = 0
      if (activeCycle) {
        const objectives = await prisma.objective.findMany({
          where: { cycleId: activeCycle.id, ownerId: { in: memberIds } },
          select: { progress: true },
        })
        okrProgress = objectives.length > 0
          ? Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length)
          : 0
      }

      // Get team member task count
      const taskCount = await prisma.taskAssignee.count({
        where: { memberId: { in: memberIds } },
      })

      return { okrProgress, taskCount }
    }),

  memberStats: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
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

      // Find active cycle
      const activeCycle = await prisma.okrCycle.findFirst({
        where: { organizationId: input.organizationId, status: "active" },
      })

      let okrProgress = 0
      if (activeCycle) {
        const objectives = await prisma.objective.findMany({
          where: { cycleId: activeCycle.id, ownerId: member.id },
          select: { progress: true },
        })
        okrProgress = objectives.length > 0
          ? Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length)
          : 0
      }

      const taskCount = await prisma.taskAssignee.count({
        where: { memberId: member.id },
      })

      return { okrProgress, taskCount }
    }),
})
