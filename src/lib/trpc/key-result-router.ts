import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { prisma } from "@/lib/prisma"
import { router, protectedProcedure } from "./server"

function calcProgress(currentValue: number, targetValue: number): number {
  if (targetValue <= 0) return 0
  return Math.min(100, Math.round((currentValue / targetValue) * 1000) / 10)
}

function calcStatus(progress: number): string {
  if (progress >= 100) return "achieved"
  if (progress >= 75) return "on_track"
  if (progress >= 50) return "at_risk"
  if (progress > 0) return "behind"
  return "not_started"
}

export const keyResultRouter = router({
  list: protectedProcedure
    .input(z.object({ objectiveId: z.string(), organizationId: z.string() }))
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

      const keyResults = await prisma.keyResult.findMany({
        where: { objectiveId: input.objectiveId },
        include: {
          owner: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
          checkIns: { orderBy: { createdAt: "desc" }, take: 5 },
        },
        orderBy: { createdAt: "asc" },
      })
      return { keyResults }
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().nullable().optional(),
        targetValue: z.number(),
        maxValue: z.number().nullable().optional(),
        currentValue: z.number().optional(),
        unit: z.string().optional(),
        weight: z.number().optional(),
        objectiveId: z.string(),
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

      // Allow admin/owner and team leaders to create KRs
      if (!isAdmin) {
        const isTeamLeader = await prisma.team.findFirst({
          where: { leaderId: member.id, organizationId: input.organizationId },
        })
        if (!isTeamLeader) throw new TRPCError({ code: "FORBIDDEN" })
      }

      // Validate objective belongs to org and get its owner
      const objective = await prisma.objective.findUnique({
        where: { id: input.objectiveId },
      })
      if (!objective || objective.organizationId !== input.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Objective not found" })
      }

      // Team leaders can only add KRs to objectives owned by their team members
      if (!isAdmin) {
        if (!objective.ownerId) throw new TRPCError({ code: "FORBIDDEN", message: "Can only add KRs to team member objectives" })

        const objOwner = await prisma.member.findUnique({ where: { id: objective.ownerId } })
        if (!objOwner) throw new TRPCError({ code: "BAD_REQUEST", message: "Objective owner not found" })

        const teamMember = await prisma.teamMember.findFirst({
          where: {
            userId: objOwner.userId,
            team: { leaderId: member.id, organizationId: input.organizationId },
          },
        })
        if (!teamMember) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Can only add KRs to your team's objectives" })
        }
      }

      const currentValue = input.currentValue ?? 0
      const krProgress = calcProgress(currentValue, input.targetValue)

      // For org/team-level objectives (no ownerId), KRs are owned by the creator
      const krOwnerId = objective.ownerId ?? member.id

      const keyResult = await prisma.keyResult.create({
        data: {
          title: input.title,
          description: input.description ?? null,
          targetValue: input.targetValue,
          maxValue: input.maxValue ?? null,
          currentValue,
          unit: input.unit ?? "number",
          weight: input.weight ?? 1.0,
          progress: krProgress,
          status: calcStatus(krProgress),
          ownerId: krOwnerId,
          objectiveId: input.objectiveId,
          organizationId: input.organizationId,
        },
        include: {
          owner: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
        },
      })

      await recalcObjectiveProgress(objective.id)

      return { keyResult }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().nullable().optional(),
        targetValue: z.number().optional(),
        maxValue: z.number().nullable().optional(),
        currentValue: z.number().optional(),
        unit: z.string().optional(),
        weight: z.number().optional(),
        ownerId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.keyResult.findUnique({
        where: { id: input.id },
        include: { objective: true },
      })
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
      const isOwner = existing.ownerId === member.id

      // Check if user is team leader of the KR owner
      let isTeamLeader = false
      if (!isAdmin && !isOwner && existing.ownerId) {
        const ownerMember = await prisma.member.findUnique({ where: { id: existing.ownerId } })
        if (ownerMember) {
          const tm = await prisma.teamMember.findFirst({
            where: {
              userId: ownerMember.userId,
              team: { leaderId: member.id, organizationId: existing.organizationId },
            },
          })
          isTeamLeader = !!tm
        }
      }

      if (!isAdmin && !isOwner && !isTeamLeader) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }

      // Non-admin non-team-leader members can only update currentValue
      const restricted = !isAdmin && !isTeamLeader
      if (restricted && input.title !== undefined) throw new TRPCError({ code: "FORBIDDEN" })
      if (restricted && input.targetValue !== undefined) throw new TRPCError({ code: "FORBIDDEN" })
      if (restricted && input.unit !== undefined) throw new TRPCError({ code: "FORBIDDEN" })
      if (restricted && input.weight !== undefined) throw new TRPCError({ code: "FORBIDDEN" })
      if (restricted && input.ownerId !== undefined) throw new TRPCError({ code: "FORBIDDEN" })

      const data: Record<string, unknown> = {}
      if (input.title !== undefined) data.title = input.title
      if (input.description !== undefined) data.description = input.description
      if (input.targetValue !== undefined) data.targetValue = input.targetValue
      if (input.maxValue !== undefined) data.maxValue = input.maxValue
      if (input.currentValue !== undefined) data.currentValue = input.currentValue
      if (input.unit !== undefined) data.unit = input.unit
      if (input.weight !== undefined) data.weight = input.weight
      if (input.ownerId !== undefined) data.ownerId = input.ownerId

      // Recalculate progress if targetValue or currentValue changed
      const targetValue = input.targetValue ?? existing.targetValue
      const currentValue = input.currentValue ?? existing.currentValue
      data.progress = calcProgress(currentValue, targetValue)
      data.status = calcStatus(data.progress as number)

      const keyResult = await prisma.keyResult.update({
        where: { id: input.id },
        data,
        include: {
          owner: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
        },
      })

      await recalcObjectiveProgress(existing.objectiveId)

      return { keyResult }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.keyResult.findUnique({ where: { id: input.id } })
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" })

      const member = await prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: existing.organizationId,
            userId: ctx.session.user.id,
          },
        },
      })
      if (!member || (member.role !== "admin" && member.role !== "owner")) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }

      await prisma.$transaction(async (tx) => {
        await tx.keyResult.delete({ where: { id: input.id } })
      })

      await recalcObjectiveProgress(existing.objectiveId)

      return { success: true }
    }),
})

async function recalcObjectiveProgress(objectiveId: string) {
  const allKrs = await prisma.keyResult.findMany({
    where: { objectiveId },
  })

  if (allKrs.length === 0) {
    await prisma.objective.update({
      where: { id: objectiveId },
      data: { progress: 0, status: "not_started" },
    })
    return
  }

  const totalWeight = allKrs.reduce((sum, kr) => sum + kr.weight, 0)
  const objectiveProgress =
    totalWeight > 0
      ? Math.round(
          (allKrs.reduce((sum, kr) => sum + kr.progress * kr.weight, 0) / totalWeight) * 10,
        ) / 10
      : 0

  const avgProgress = allKrs.reduce((sum, kr) => sum + kr.progress, 0) / allKrs.length

  let objectiveStatus: string
  if (objectiveProgress >= 100) objectiveStatus = "completed"
  else if (objectiveProgress >= 75) objectiveStatus = "on_track"
  else if (objectiveProgress >= 50) objectiveStatus = "at_risk"
  else if (objectiveProgress > 0 || avgProgress > 0) objectiveStatus = "behind"
  else objectiveStatus = "not_started"

  await prisma.objective.update({
    where: { id: objectiveId },
    data: { progress: objectiveProgress, status: objectiveStatus },
  })
}
