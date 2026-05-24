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
      const isAdmin = member.role === "admin" || member.role === "owner"

      // Cycle validation
      const cycle = await prisma.okrCycle.findUnique({
        where: { id: input.cycleId },
      })
      if (!cycle || cycle.organizationId !== input.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cycle not found" })
      }

      const hasOwner = !!input.ownerId
      const hasTeam = !!input.teamId

      // Permission rules:
      // Admin/owner: can create org-level (no owner, no team) and team-level (teamId set)
      // Admin/owner: CANNOT create member-level (ownerId set) — only team leader does that
      // Team leader: can create member-level (ownerId set, teamId implied by their team)
      // Team leader: CANNOT create org-level or team-level

      if (isAdmin) {
        if (hasOwner) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admins cannot assign OKRs to members directly. Only team leaders can." })
        }
        // Validate team if teamId set
        if (hasTeam) {
          const team = await prisma.team.findUnique({ where: { id: input.teamId } })
          if (!team || team.organizationId !== input.organizationId) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid team" })
          }
        }
      } else {
        const isTeamLeader = await prisma.team.findFirst({
          where: { leaderId: member.id, organizationId: input.organizationId },
        })
        if (!isTeamLeader) throw new TRPCError({ code: "FORBIDDEN" })

        if (!hasOwner) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Team leaders can only assign OKRs to team members." })
        }
        if (hasTeam) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Team leaders cannot assign team-level OKRs." })
        }

        // Validate owner is in their team
        const targetOwner = await prisma.member.findUnique({ where: { id: input.ownerId } })
        if (!targetOwner || targetOwner.organizationId !== input.organizationId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid owner" })
        }

        const teamMember = await prisma.teamMember.findFirst({
          where: {
            userId: targetOwner.userId,
            team: { leaderId: member.id, organizationId: input.organizationId },
          },
        })
        if (!teamMember) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Can only assign OKRs to your team members" })
        }
      }

      // Validate owner if provided
      if (hasOwner) {
        const owner = await prisma.member.findUnique({ where: { id: input.ownerId } })
        if (!owner || owner.organizationId !== input.organizationId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid owner" })
        }
      }

      const objective = await prisma.objective.create({
        data: {
          title: input.title,
          description: input.description ?? null,
          ownerId: input.ownerId ?? null,
          teamId: input.teamId ?? null,
          cycleId: input.cycleId,
          organizationId: input.organizationId,
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
