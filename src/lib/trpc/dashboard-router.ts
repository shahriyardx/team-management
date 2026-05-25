import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { prisma } from "@/lib/prisma"
import { router, protectedProcedure, getMember, calcProgress } from "./server"

async function findActiveCycle(organizationId: string) {
  return prisma.okrCycle.findFirst({
    where: { organizationId, status: "active" },
    orderBy: { startDate: "desc" },
  })
}

export const dashboardRouter = router({
  orgStats: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const member = await getMember(input.organizationId, ctx.session.user.id)
      if (!member || (member.role !== "admin" && member.role !== "owner")) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }

      const [memberCount, teamCount, taskCount] = await Promise.all([
        prisma.member.count({
          where: { organizationId: input.organizationId },
        }),
        prisma.team.count({ where: { organizationId: input.organizationId } }),
        prisma.task.count({ where: { organizationId: input.organizationId } }),
      ])

      // Calculate storage used from actual attachment sizes
      const [announcementBytes, kbBytes] = await Promise.all([
        prisma.announcementAttachment.aggregate({
          where: { announcement: { organizationId: input.organizationId } },
          _sum: { size: true },
        }),
        prisma.kbAttachment.aggregate({
          where: { kbItem: { organizationId: input.organizationId } },
          _sum: { size: true },
        }),
      ])

      const storageUsed =
        Number(announcementBytes._sum.size ?? 0) +
        Number(kbBytes._sum.size ?? 0)
      const storageLimit = 1073741824

      return { memberCount, teamCount, taskCount, storageUsed, storageLimit }
    }),

  teamStats: protectedProcedure
    .input(z.object({ teamId: z.string(), organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const member = await getMember(input.organizationId, ctx.session.user.id)
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      const activeCycle = await findActiveCycle(input.organizationId)

      let okrProgress = 0
      if (activeCycle) {
        const objectives = await prisma.objective.findMany({
          where: {
            cycleId: activeCycle.id,
            teamId: input.teamId,
            ownerId: null,
          },
          select: { progress: true },
        })
        okrProgress = calcProgress(objectives)
      }

      const taskCount = await prisma.taskAssignee.count({
        where: {
          task: { teamId: input.teamId, status: { not: "done" } },
        },
      })

      return { okrProgress, taskCount }
    }),

  memberStats: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const member = await getMember(input.organizationId, ctx.session.user.id)
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      const activeCycle = await findActiveCycle(input.organizationId)

      let okrProgress = 0
      if (activeCycle) {
        const objectives = await prisma.objective.findMany({
          where: { cycleId: activeCycle.id, ownerId: member.id },
          select: { progress: true },
        })
        okrProgress = calcProgress(objectives)
      }

      const taskCount = await prisma.taskAssignee.count({
        where: { memberId: member.id, task: { status: { not: "done" } } },
      })

      return { okrProgress, taskCount }
    }),
})
