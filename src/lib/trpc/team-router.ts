import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { prisma } from "@/lib/prisma"
import { router, protectedProcedure } from "./server"

export const teamRouter = router({
  list: protectedProcedure
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

      const teams = await prisma.team.findMany({
        where: { organizationId: input.organizationId },
        include: {
          leader: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      })

      return { teams }
    }),

  getById: protectedProcedure
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

      const team = await prisma.team.findFirst({
        where: { id: input.teamId, organizationId: input.organizationId },
        include: {
          leader: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      })
      if (!team) throw new TRPCError({ code: "NOT_FOUND" })

      return { team }
    }),

  getMyTeams: protectedProcedure
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

      const isOwnerAdmin = member.role === "owner" || member.role === "admin"
      const teams = await prisma.team.findMany({
        where: {
          organizationId: input.organizationId,
          ...(isOwnerAdmin ? {} : { members: { some: { userId: ctx.session.user.id } } }),
        },
        include: {
          leader: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      })

      return { teams }
    }),

  setActiveTeam: protectedProcedure
    .input(z.object({ teamId: z.string(), organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const member = await prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId: ctx.session.user.id,
          },
        },
      })
      if (!member || (member.role !== "owner" && member.role !== "admin")) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }

      const team = await prisma.team.findFirst({
        where: { id: input.teamId, organizationId: input.organizationId },
      })
      if (!team) throw new TRPCError({ code: "NOT_FOUND" })

      await prisma.session.update({
        where: { id: ctx.session.session.id },
        data: { activeTeamId: input.teamId },
      })

      return { success: true }
    }),

  addTeamMember: protectedProcedure
    .input(z.object({ teamId: z.string(), organizationId: z.string(), userId: z.string() }))
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

      const team = await prisma.team.findFirst({
        where: { id: input.teamId, organizationId: input.organizationId },
      })
      if (!team) throw new TRPCError({ code: "NOT_FOUND" })

      const isOwnerAdmin = member.role === "owner" || member.role === "admin"
      const isLeader = team.leaderId === member.id
      if (!isOwnerAdmin && !isLeader) throw new TRPCError({ code: "FORBIDDEN" })

      const targetMember = await prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId: input.userId,
          },
        },
      })
      if (!targetMember) throw new TRPCError({ code: "BAD_REQUEST", message: "User is not an org member" })

      const existing = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: input.teamId, userId: input.userId } },
      })
      if (existing) throw new TRPCError({ code: "BAD_REQUEST", message: "Already a member of this team" })

      await prisma.teamMember.create({
        data: { teamId: input.teamId, userId: input.userId, role: "member" },
      })

      return { success: true }
    }),

  setLeader: protectedProcedure
    .input(z.object({ teamId: z.string(), leaderMemberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const team = await prisma.team.findUnique({ where: { id: input.teamId } })
      if (!team) throw new TRPCError({ code: "NOT_FOUND" })

      const member = await prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: team.organizationId,
            userId: ctx.session.user.id,
          },
        },
      })
      if (!member || (member.role !== "admin" && member.role !== "owner")) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }

      // Verify leader member belongs to org
      const leaderMember = await prisma.member.findUnique({ where: { id: input.leaderMemberId } })
      if (!leaderMember || leaderMember.organizationId !== team.organizationId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid leader" })
      }

      await prisma.$transaction(async (tx) => {
        // Update role of old leader member to "member"
        if (team.leaderId) {
          await tx.teamMember.updateMany({
            where: { teamId: input.teamId, userId: leaderMember.userId },
            data: { role: "member" },
          })
        }

        // Update team leader
        await tx.team.update({
          where: { id: input.teamId },
          data: { leaderId: input.leaderMemberId },
        })

        // Set the new leader's role in team
        const existingMembership = await tx.teamMember.findUnique({
          where: { teamId_userId: { teamId: input.teamId, userId: leaderMember.userId } },
        })
        if (existingMembership) {
          await tx.teamMember.update({
            where: { teamId_userId: { teamId: input.teamId, userId: leaderMember.userId } },
            data: { role: "leader" },
          })
        } else {
          await tx.teamMember.create({
            data: { teamId: input.teamId, userId: leaderMember.userId, role: "leader" },
          })
        }
      })

      return { success: true }
    }),
})
