import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { prisma } from "@/lib/prisma"
import { router, protectedProcedure } from "./server"

function deriveYears(cycles: { startDate: Date }[]) {
  const yearSet = new Set([String(new Date().getFullYear())])
  for (const c of cycles) {
    const y = c.startDate?.getFullYear()
    if (y) yearSet.add(String(y))
  }
  return Array.from(yearSet).sort().reverse()
}

export const okrCycleRouter = router({
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

      const [cycles, total, yearItems] = await prisma.$transaction(async (tx) => {
        const items = await tx.okrCycle.findMany({
          where: { organizationId: input.organizationId },
          include: { _count: { select: { objectives: true } } },
          orderBy: { startDate: "desc" },
          skip: input.skip,
          take: input.take,
        })
        const count = await tx.okrCycle.count({ where: { organizationId: input.organizationId } })
        const allYears = await tx.okrCycle.findMany({
          where: { organizationId: input.organizationId },
          select: { startDate: true },
          orderBy: { startDate: "desc" },
        })
        return [items, count, allYears] as const
      })

      return { cycles, total, years: deriveYears(yearItems) }
    }),

  listActive: protectedProcedure
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

      const [cycles, total, yearItems] = await prisma.$transaction(async (tx) => {
        const items = await tx.okrCycle.findMany({
          where: { organizationId: input.organizationId, status: "active" },
          include: { _count: { select: { objectives: true } } },
          orderBy: { startDate: "desc" },
          skip: input.skip,
          take: input.take,
        })
        const count = await tx.okrCycle.count({
          where: { organizationId: input.organizationId, status: "active" },
        })
        const allYears = await tx.okrCycle.findMany({
          where: { organizationId: input.organizationId, status: "active" },
          select: { startDate: true },
          orderBy: { startDate: "desc" },
        })
        return [items, count, allYears] as const
      })

      return { cycles, total, years: deriveYears(yearItems) }
    }),

  getActive: protectedProcedure
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

      const cycle = await prisma.okrCycle.findFirst({
        where: { organizationId: input.organizationId, status: "active" },
      })
      return { cycle }
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().nullable().optional(),
        cycleType: z.string().optional(),
        startDate: z.string(),
        endDate: z.string(),
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
      if (!member || (member.role !== "admin" && member.role !== "owner")) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }

      const cycle = await prisma.okrCycle.create({
        data: {
          title: input.title,
          description: input.description ?? null,
          cycleType: input.cycleType ?? "quarterly",
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          organizationId: input.organizationId,
        },
      })
      return { cycle }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().nullable().optional(),
        cycleType: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.string().optional(),
        locked: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.okrCycle.findUnique({ where: { id: input.id } })
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

      const cycle = await prisma.okrCycle.update({
        where: { id: input.id },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.cycleType !== undefined && { cycleType: input.cycleType }),
          ...(input.startDate !== undefined && { startDate: new Date(input.startDate) }),
          ...(input.endDate !== undefined && { endDate: new Date(input.endDate) }),
          ...(input.status !== undefined && { status: input.status }),
          ...(input.locked !== undefined && { locked: input.locked }),
        },
      })
      return { cycle }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.okrCycle.findUnique({ where: { id: input.id } })
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

      await prisma.okrCycle.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
