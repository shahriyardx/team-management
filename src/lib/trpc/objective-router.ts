import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { prisma } from "@/lib/prisma"
import { router, protectedProcedure, getMember } from "./server"

export const objectiveRouter = router({
  listOrgLevel: protectedProcedure
    .input(z.object({ cycleId: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.session.session.activeOrganizationId
      if (!orgId) throw new TRPCError({ code: "FORBIDDEN" })

      const member = await getMember(orgId, ctx.session.user.id)
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      const objectives = await prisma.objective.findMany({
        where: {
          cycleId: input.cycleId,
          organizationId: orgId,
          teamId: null,
          ownerId: null,
        },
        include: {
          owner: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
          keyResults: {
            include: {
              owner: {
                include: {
                  user: {
                    select: { id: true, name: true, email: true, image: true },
                  },
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

  listTeamLevel: protectedProcedure
    .input(z.object({ cycleId: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.session.session.activeOrganizationId
      const activeTeamId = ctx.session.session.activeTeamId
      if (!orgId) throw new TRPCError({ code: "FORBIDDEN" })

      const member = await getMember(orgId, ctx.session.user.id)
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      const isAdmin = member.role === "admin" || member.role === "owner"

      const where: Record<string, unknown> = {
        cycleId: input.cycleId,
        organizationId: orgId,
        teamId: { not: null },
        ownerId: null,
      }

      if (activeTeamId) {
        if (isAdmin) {
          where.teamId = activeTeamId
        } else {
          const canAccess = await prisma.team.findFirst({
            where: {
              id: activeTeamId,
              organizationId: orgId,
              OR: [
                { leaderId: member.id },
                { members: { some: { userId: ctx.session.user.id } } },
              ],
            },
          })
          if (!canAccess) throw new TRPCError({ code: "FORBIDDEN" })
          where.teamId = activeTeamId
        }
      } else if (!isAdmin) {
        const ledTeamIds = (
          await prisma.team.findMany({
            where: { leaderId: member.id, organizationId: orgId },
            select: { id: true },
          })
        ).map((t) => t.id)

        const memberTeamIds = (
          await prisma.teamMember.findMany({
            where: {
              userId: ctx.session.user.id,
              team: { organizationId: orgId },
            },
            select: { teamId: true },
          })
        ).map((t) => t.teamId)

        const accessibleTeamIds = [
          ...new Set([...ledTeamIds, ...memberTeamIds]),
        ]
        if (accessibleTeamIds.length > 0) {
          where.teamId = { in: accessibleTeamIds }
        } else {
          where.id = "none"
        }
      }

      const objectives = await prisma.objective.findMany({
        where,
        include: {
          owner: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
          keyResults: {
            include: {
              owner: {
                include: {
                  user: {
                    select: { id: true, name: true, email: true, image: true },
                  },
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

  listTeamLevelAdmin: protectedProcedure
    .input(z.object({ cycleId: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.session.session.activeOrganizationId
      if (!orgId) throw new TRPCError({ code: "FORBIDDEN" })

      const member = await getMember(orgId, ctx.session.user.id)
      if (!member || (member.role !== "admin" && member.role !== "owner")) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }

      const objectives = await prisma.objective.findMany({
        where: {
          cycleId: input.cycleId,
          organizationId: orgId,
          teamId: { not: null },
          ownerId: null,
        },
        include: {
          owner: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
          keyResults: {
            include: {
              owner: {
                include: {
                  user: {
                    select: { id: true, name: true, email: true, image: true },
                  },
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

  listMemberLevel: protectedProcedure
    .input(z.object({ cycleId: z.string() }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.session.session.activeOrganizationId
      const activeTeamId = ctx.session.session.activeTeamId
      if (!orgId) throw new TRPCError({ code: "FORBIDDEN" })

      const member = await getMember(orgId, ctx.session.user.id)
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      const isAdmin = member.role === "admin" || member.role === "owner"

      const where: Record<string, unknown> = {
        cycleId: input.cycleId,
        organizationId: orgId,
      }

      if (activeTeamId) {
        const isTeamLeader = await prisma.team.findFirst({
          where: {
            id: activeTeamId,
            leaderId: member.id,
            organizationId: orgId,
          },
        })

        if (isAdmin || isTeamLeader) {
          const teamMembers = await prisma.teamMember.findMany({
            where: { teamId: activeTeamId },
            select: { userId: true },
          })
          const userIds = [...new Set(teamMembers.map((tm) => tm.userId))]
          const memberRecords = await prisma.member.findMany({
            where: {
              userId: { in: userIds },
              organizationId: orgId,
            },
            select: { id: true },
          })
          where.ownerId = {
            in: [...memberRecords.map((m) => m.id), member.id],
          }
          where.teamId = activeTeamId
        } else {
          where.ownerId = member.id
          where.teamId = activeTeamId
        }
      } else {
        where.ownerId = member.id
      }

      const objectives = await prisma.objective.findMany({
        where,
        include: {
          owner: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
          keyResults: {
            include: {
              owner: {
                include: {
                  user: {
                    select: { id: true, name: true, email: true, image: true },
                  },
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

  createOrgLevel: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().nullable().optional(),
        cycleId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.session.session.activeOrganizationId
      if (!orgId) throw new TRPCError({ code: "FORBIDDEN" })

      const member = await getMember(orgId, ctx.session.user.id)
      if (!member || (member.role !== "admin" && member.role !== "owner")) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }

      const cycle = await prisma.okrCycle.findUnique({
        where: { id: input.cycleId },
      })
      if (!cycle || cycle.organizationId !== orgId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cycle not found" })
      }

      const objective = await prisma.objective.create({
        data: {
          title: input.title,
          description: input.description ?? null,
          cycleId: input.cycleId,
          organizationId: orgId,
        },
        include: {
          owner: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
          team: { select: { id: true, name: true } },
        },
      })
      return { objective }
    }),

  createTeamLevel: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().nullable().optional(),
        teamId: z.string(),
        cycleId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.session.session.activeOrganizationId
      if (!orgId) throw new TRPCError({ code: "FORBIDDEN" })

      const member = await getMember(orgId, ctx.session.user.id)
      if (!member || (member.role !== "admin" && member.role !== "owner")) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }

      const cycle = await prisma.okrCycle.findUnique({
        where: { id: input.cycleId },
      })
      if (!cycle || cycle.organizationId !== orgId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cycle not found" })
      }

      const team = await prisma.team.findUnique({ where: { id: input.teamId } })
      if (!team || team.organizationId !== orgId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid team" })
      }

      const objective = await prisma.objective.create({
        data: {
          title: input.title,
          description: input.description ?? null,
          teamId: input.teamId,
          cycleId: input.cycleId,
          organizationId: orgId,
        },
        include: {
          owner: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
          team: { select: { id: true, name: true } },
        },
      })
      return { objective }
    }),

  createMemberLevel: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().nullable().optional(),
        ownerId: z.string(),
        cycleId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.session.session.activeOrganizationId
      const activeTeamId = ctx.session.session.activeTeamId
      if (!orgId || !activeTeamId) throw new TRPCError({ code: "FORBIDDEN" })

      const member = await getMember(orgId, ctx.session.user.id)
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      const cycle = await prisma.okrCycle.findUnique({
        where: { id: input.cycleId },
      })
      if (!cycle || cycle.organizationId !== orgId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cycle not found" })
      }

      if (cycle.locked) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cycle is locked." })
      }

      const targetOwner = await prisma.member.findUnique({
        where: { id: input.ownerId },
      })
      if (!targetOwner || targetOwner.organizationId !== orgId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid owner" })
      }

      const team = await prisma.team.findFirst({
        where: {
          id: activeTeamId,
          organizationId: orgId,
          leaderId: member.id,
          members: { some: { userId: targetOwner.userId } },
        },
      })
      if (!team) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only team leaders can assign OKRs to members.",
        })
      }

      const objective = await prisma.objective.create({
        data: {
          title: input.title,
          description: input.description ?? null,
          ownerId: input.ownerId,
          teamId: activeTeamId,
          cycleId: input.cycleId,
          organizationId: orgId,
        },
        include: {
          owner: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
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
      const existing = await prisma.objective.findUnique({
        where: { id: input.id },
        include: { cycle: true },
      })
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" })

      const member = await getMember(
        existing.organizationId,
        ctx.session.user.id,
      )
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      const isAdmin = member.role === "admin" || member.role === "owner"
      const isMemberLevel = !!existing.ownerId

      if (!isAdmin && existing.cycle?.locked) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cycle is locked." })
      }

      if (isAdmin) {
        if (isMemberLevel) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admins cannot edit member-level OKRs.",
          })
        }
      } else {
        if (!isMemberLevel) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Can only edit member-level OKRs.",
          })
        }

        if (!existing.teamId) throw new TRPCError({ code: "FORBIDDEN" })

        const isTeamLeader = await prisma.team.findFirst({
          where: {
            id: existing.teamId,
            leaderId: member.id,
            organizationId: existing.organizationId,
          },
        })
        if (!isTeamLeader) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Can only edit objectives in your own team.",
          })
        }

        const owner = await prisma.member.findUnique({
          where: { id: existing.ownerId! },
        })
        if (!owner || owner.organizationId !== existing.organizationId) {
          throw new TRPCError({ code: "BAD_REQUEST" })
        }

        const teamMember = await prisma.teamMember.findFirst({
          where: {
            userId: owner.userId,
            teamId: existing.teamId,
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
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
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
      const existing = await prisma.objective.findUnique({
        where: { id: input.id },
        include: { cycle: true },
      })
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" })

      const member = await getMember(
        existing.organizationId,
        ctx.session.user.id,
      )
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      const isAdmin = member.role === "admin" || member.role === "owner"

      if (!isAdmin && existing.cycle?.locked) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cycle is locked." })
      }

      if (!isAdmin) {
        if (!existing.teamId) throw new TRPCError({ code: "FORBIDDEN" })

        const isTeamLeader = await prisma.team.findFirst({
          where: {
            id: existing.teamId,
            leaderId: member.id,
            organizationId: existing.organizationId,
          },
        })
        if (!isTeamLeader) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Can only delete objectives in your own team.",
          })
        }
      }

      await prisma.objective.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
