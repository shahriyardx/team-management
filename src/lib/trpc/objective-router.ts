import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { prisma } from "@/lib/prisma"
import { router, protectedProcedure } from "./server"

export const objectiveRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        cycleId: z.string(),
        organizationId: z.string(),
        teamId: z.string().optional(),
        ownerId: z.string().optional(),
        scope: z.enum(["org", "team", "member"]).optional(),
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

      const isAdmin = member.role === "admin" || member.role === "owner"

      const where: Record<string, unknown> = { cycleId: input.cycleId }

      // Apply scope filter
      if (input.scope === "org") {
        where.teamId = null
        where.ownerId = null
      } else if (input.scope === "team") {
        where.teamId = { not: null }
      } else if (input.scope === "member") {
        where.ownerId = member.id
      }

      // Optional explicit filters override scope
      // Member-level objectives don't have teamId set, so filter by owner's team membership instead
      if (input.teamId !== undefined && input.scope !== "member") where.teamId = input.teamId
      if (input.ownerId !== undefined) where.ownerId = input.ownerId

      // Non-admin permission filter
      if (!isAdmin) {
        const ledTeams = await prisma.team.findMany({
          where: { leaderId: member.id, organizationId: input.organizationId },
          select: { id: true },
        })

        if (ledTeams.length > 0) {
          const teamIds = ledTeams.map((t) => t.id)
          if (input.scope === "team") {
            // Team leader seeing team-level OKRs: only their teams
            where.teamId = { in: teamIds }
          } else if (input.scope === "member" && input.teamId) {
            // Member-level OKRs scoped to a specific team
            const teamMembers = await prisma.teamMember.findMany({
              where: { teamId: input.teamId },
              select: { userId: true },
            })
            const teamUserIds = [...new Set(teamMembers.map((tm) => tm.userId))]
            const memberRecords = await prisma.member.findMany({
              where: { userId: { in: teamUserIds }, organizationId: input.organizationId },
              select: { id: true },
            })
            where.ownerId = { in: [...memberRecords.map((m) => m.id), member.id] }
          } else {
            // General: team leader can see their team's objectives + their own
            const teamMembers = await prisma.teamMember.findMany({
              where: { teamId: { in: teamIds } },
              select: { userId: true },
            })
            const teamUserIds = [...new Set(teamMembers.map((tm) => tm.userId))]
            const memberRecords = await prisma.member.findMany({
              where: { userId: { in: teamUserIds }, organizationId: input.organizationId },
              select: { id: true },
            })
            const memberIds = memberRecords.map((m) => m.id)
            memberIds.push(member.id)

            where.OR = [
              { ownerId: { in: memberIds } },
              { teamId: { in: teamIds } },
            ]
          }
        } else {
          // Regular member: only their own objectives
          if (input.teamId) {
            // Team member seeing their team's OKR (for team-level objectives)
            // Keep the teamId filter
          } else {
            where.ownerId = member.id
          }
        }
      }

      const objectives = await prisma.objective.findMany({
        where,
        include: {
          owner: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
          keyResults: {
            include: {
              owner: {
                include: {
                  user: { select: { id: true, name: true, email: true, image: true } },
                },
              },
              checkIns: { orderBy: { createdAt: "desc" }, take: 5 },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      })

      return { objectives }
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().nullable().optional(),
        ownerId: z.string().optional(),
        teamId: z.string().optional(),
        cycleId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.session.session.activeOrganizationId
      if (!orgId) throw new TRPCError({ code: "FORBIDDEN" })

      const member = await prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: orgId,
            userId: ctx.session.user.id,
          },
        },
      })
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })
      const isAdmin = member.role === "admin" || member.role === "owner"

      // Cycle validation
      const cycle = await prisma.okrCycle.findUnique({
        where: { id: input.cycleId },
      })
      if (!cycle || cycle.organizationId !== orgId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cycle not found" })
      }

      const hasOwner = !!input.ownerId
      const hasTeam = !!input.teamId

      if (hasOwner) {
        // Member-level — must be team leader of target's team
        const teamId = ctx.session.session.activeTeamId
        if (!teamId) throw new TRPCError({ code: "FORBIDDEN", message: "No active team" })
        const targetOwner = await prisma.member.findUnique({ where: { id: input.ownerId } })
        if (!targetOwner || targetOwner.organizationId !== orgId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid owner" })
        }
        const team = await prisma.team.findFirst({
          where: { id: teamId, organizationId: orgId, leaderId: member.id, members: { some: { userId: targetOwner.userId } } },
        })
        if (!team) throw new TRPCError({ code: "FORBIDDEN", message: "Only team leaders can assign OKRs to members." })
      } else if (hasTeam) {
        // Team-level — admin/owner only
        if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN" })
        const team = await prisma.team.findUnique({ where: { id: input.teamId } })
        if (!team || team.organizationId !== orgId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid team" })
        }
      } else if (!isAdmin) {
        // Org-level — admin/owner only
        throw new TRPCError({ code: "FORBIDDEN" })
      }

      // Validate owner if provided
      if (hasOwner) {
        const owner = await prisma.member.findUnique({ where: { id: input.ownerId } })
        if (!owner || owner.organizationId !== orgId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid owner" })
        }
      }

      // Resolve teamId: member-level uses activeTeamId from session, team-level from input
      const resolvedTeamId = hasOwner ? ctx.session.session.activeTeamId : (input.teamId ?? null)

      const objective = await prisma.objective.create({
        data: {
          title: input.title,
          description: input.description ?? null,
          ownerId: input.ownerId ?? null,
          teamId: resolvedTeamId,
          cycleId: input.cycleId,
          organizationId: orgId,
        },
        include: {
          owner: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
          team: { select: { id: true, name: true } },
        },
      })
      return { objective }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1, "Title is required."),
        status: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.objective.findUnique({ where: { id: input.id } })
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

      const isAdmin = member.role === "admin" || member.role === "owner"
      const isMemberLevel = !!existing.ownerId

      if (isAdmin) {
        // Admin: can edit org-level and team-level only
        if (isMemberLevel) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admins cannot edit member-level OKRs.",
          })
        }
      } else {
        // Non-admin: must be team leader editing their team's member-level OKRs
        if (!isMemberLevel) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Can only edit member-level OKRs.",
          })
        }

        const isTeamLeader = await prisma.team.findFirst({
          where: { leaderId: member.id, organizationId: existing.organizationId },
        })
        if (!isTeamLeader) throw new TRPCError({ code: "FORBIDDEN" })

        const owner = await prisma.member.findUnique({ where: { id: existing.ownerId! } })
        if (!owner || owner.organizationId !== existing.organizationId) {
          throw new TRPCError({ code: "BAD_REQUEST" })
        }

        const teamMember = await prisma.teamMember.findFirst({
          where: {
            userId: owner.userId,
            team: { leaderId: member.id, organizationId: existing.organizationId },
          },
        })
        if (!teamMember) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Can only edit your team members' OKRs.",
          })
        }
      }

      const objective = await prisma.objective.update({
        where: { id: input.id },
        data: {
          title: input.title,
          ...(input.status !== undefined && { status: input.status }),
        },
        include: {
          owner: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
          team: { select: { id: true, name: true } },
        },
      })
      return { objective }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.objective.findUnique({ where: { id: input.id } })
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

      const isAdmin = member.role === "admin" || member.role === "owner"

      if (!isAdmin) {
        // Check if team leader deleting their team's objectives
        const isTeamLeader = await prisma.team.findFirst({
          where: { leaderId: member.id, organizationId: existing.organizationId },
        })
        if (!isTeamLeader) throw new TRPCError({ code: "FORBIDDEN" })
      }

      await prisma.objective.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
