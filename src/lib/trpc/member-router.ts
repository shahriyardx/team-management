import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { prisma } from "@/lib/prisma"
import { router, protectedProcedure } from "./server"

export const memberRouter = router({
  listByUserIds: protectedProcedure
    .input(z.object({
      organizationId: z.string(),
      userIds: z.array(z.string()),
    }))
    .query(async ({ ctx, input }) => {
      const members = await prisma.member.findMany({
        where: {
          organizationId: input.organizationId,
          userId: { in: input.userIds },
        },
      })
      return { members }
    }),

  getMyRole: protectedProcedure
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

      if (member.role === "owner" || member.role === "admin") {
        return { role: member.role as "owner" | "admin" }
      }

      // Check team leader status via memberId
      const ledTeam = await prisma.team.findFirst({
        where: { leaderId: member.id, organizationId: input.organizationId },
      })

      if (ledTeam) {
        return { role: "team_leader" as const }
      }

      // Check if member is in any real team (not the default org team)
      const org = await prisma.organization.findUnique({
        where: { id: input.organizationId },
        select: { name: true },
      })
      const realTeam = await prisma.teamMember.findFirst({
        where: {
          userId: member.userId,
          team: {
            organizationId: input.organizationId,
            name: { not: org?.name ?? "" },
          },
        },
      })

      if (realTeam) {
        return { role: "member" as const }
      }

      return { role: "pending" as const }
    }),
})
