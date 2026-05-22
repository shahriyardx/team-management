import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { prisma } from "@/lib/prisma"
import { router, protectedProcedure } from "./server"

export const knowledgeBaseRouter = router({
  // ── Categories ──

  categoryList: protectedProcedure
    .input(z.object({ organizationId: z.string(), teamId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const member = await prisma.member.findUnique({
        where: { organizationId_userId: { organizationId: input.organizationId, userId: ctx.session.user.id } },
      })
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      const where: Record<string, unknown> = { organizationId: input.organizationId }
      if (input.teamId) {
        where.teamId = input.teamId
      } else {
        where.teamId = null
      }

      const categories = await prisma.kbCategory.findMany({
        where,
        include: {
          subcategories: {
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      })
      return { categories }
    }),

  categoryCreate: protectedProcedure
    .input(z.object({ organizationId: z.string(), name: z.string().min(1).max(48), teamId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const member = await prisma.member.findUnique({
        where: { organizationId_userId: { organizationId: input.organizationId, userId: ctx.session.user.id } },
      })
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      const category = await prisma.kbCategory.create({
        data: {
          name: input.name,
          organizationId: input.organizationId,
          teamId: input.teamId ?? null,
          subcategories: {
            create: { name: "Uncategorized", organizationId: input.organizationId },
          },
        },
        include: { subcategories: true },
      })
      return { category }
    }),

  categoryUpdate: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1).max(48) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.kbCategory.findUnique({ where: { id: input.id } })
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" })

      const member = await prisma.member.findUnique({
        where: { organizationId_userId: { organizationId: existing.organizationId, userId: ctx.session.user.id } },
      })
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      const category = await prisma.kbCategory.update({
        where: { id: input.id },
        data: { name: input.name },
      })
      return { category }
    }),

  categoryDelete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.kbCategory.findUnique({ where: { id: input.id } })
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" })

      const member = await prisma.member.findUnique({
        where: { organizationId_userId: { organizationId: existing.organizationId, userId: ctx.session.user.id } },
      })
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      await prisma.kbCategory.delete({ where: { id: input.id } })
      return { success: true }
    }),

  // ── Subcategories ──

  subcategoryCreate: protectedProcedure
    .input(z.object({ categoryId: z.string(), name: z.string().min(1).max(48) }))
    .mutation(async ({ ctx, input }) => {
      const category = await prisma.kbCategory.findUnique({ where: { id: input.categoryId } })
      if (!category) throw new TRPCError({ code: "NOT_FOUND" })

      const member = await prisma.member.findUnique({
        where: { organizationId_userId: { organizationId: category.organizationId, userId: ctx.session.user.id } },
      })
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      const subcategory = await prisma.kbSubcategory.create({
        data: {
          name: input.name,
          categoryId: input.categoryId,
          organizationId: category.organizationId,
        },
      })
      return { subcategory }
    }),

  subcategoryUpdate: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1).max(48) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.kbSubcategory.findUnique({ where: { id: input.id } })
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" })

      const member = await prisma.member.findUnique({
        where: { organizationId_userId: { organizationId: existing.organizationId, userId: ctx.session.user.id } },
      })
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      const subcategory = await prisma.kbSubcategory.update({
        where: { id: input.id },
        data: { name: input.name },
      })
      return { subcategory }
    }),

  subcategoryDelete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.kbSubcategory.findUnique({ where: { id: input.id } })
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" })

      const member = await prisma.member.findUnique({
        where: { organizationId_userId: { organizationId: existing.organizationId, userId: ctx.session.user.id } },
      })
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      await prisma.kbSubcategory.delete({ where: { id: input.id } })
      return { success: true }
    }),

  // ── Items ──

  itemList: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        categoryId: z.string().optional(),
        subcategoryId: z.string().optional(),
        teamId: z.string().optional(),
        skip: z.number().int().min(0).default(0),
        take: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const member = await prisma.member.findUnique({
        where: { organizationId_userId: { organizationId: input.organizationId, userId: ctx.session.user.id } },
      })
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      const where: Record<string, unknown> = { organizationId: input.organizationId }
      if (input.teamId) {
        where.teamId = input.teamId
      } else {
        where.teamId = null
      }
      if (input.subcategoryId) where.subcategoryId = input.subcategoryId
      if (input.categoryId) {
        where.subcategory = { categoryId: input.categoryId }
      }

      const [items, total] = await prisma.$transaction(async (tx) => {
        const data = await tx.kbItem.findMany({
          where,
          include: {
            author: { select: { id: true, name: true, image: true } },
            subcategory: { select: { id: true, name: true, categoryId: true, category: { select: { id: true, name: true } } } },
            attachments: { select: { id: true, name: true, url: true, type: true } },
            links: { select: { id: true, url: true, title: true } },
            _count: { select: { attachments: true, links: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: input.skip,
          take: input.take,
        })
        const count = await tx.kbItem.count({ where })
        return [data, count] as const
      })

      return { items, total }
    }),

  itemGet: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const item = await prisma.kbItem.findUnique({
        where: { id: input.id },
        include: {
          author: { select: { id: true, name: true, email: true, image: true } },
          subcategory: {
            select: {
              id: true,
              name: true,
              category: { select: { id: true, name: true } },
            },
          },
          attachments: { select: { id: true, name: true, url: true, type: true, size: true } },
          links: { select: { id: true, url: true, title: true } },
        },
      })
      if (!item) throw new TRPCError({ code: "NOT_FOUND" })

      const member = await prisma.member.findUnique({
        where: { organizationId_userId: { organizationId: item.organizationId, userId: ctx.session.user.id } },
      })
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      return { item }
    }),

  itemCreate: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        subcategoryId: z.string(),
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        teamId: z.string().optional(),
        attachments: z
          .array(
            z.object({
              name: z.string(),
              url: z.string(),
              type: z.string(),
              size: z.number().int(),
            }),
          )
          .default([]),
        links: z
          .array(
            z.object({
              url: z.string(),
              title: z.string(),
            }),
          )
          .default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const member = await prisma.member.findUnique({
        where: { organizationId_userId: { organizationId: input.organizationId, userId: ctx.session.user.id } },
      })
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      const item = await prisma.kbItem.create({
        data: {
          title: input.title,
          description: input.description,
          subcategoryId: input.subcategoryId,
          organizationId: input.organizationId,
          teamId: input.teamId ?? null,
          authorId: ctx.session.user.id,
          attachments: {
            create: input.attachments,
          },
          links: {
            create: input.links,
          },
        },
        include: {
          author: { select: { id: true, name: true, image: true } },
          subcategory: { select: { id: true, name: true } },
          attachments: true,
          links: true,
        },
      })
      return { item }
    }),

  itemUpdate: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.kbItem.findUnique({ where: { id: input.id } })
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" })

      const member = await prisma.member.findUnique({
        where: { organizationId_userId: { organizationId: existing.organizationId, userId: ctx.session.user.id } },
      })
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      const item = await prisma.kbItem.update({
        where: { id: input.id },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && { description: input.description }),
        },
      })
      return { item }
    }),

  itemDelete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.kbItem.findUnique({ where: { id: input.id } })
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" })

      const member = await prisma.member.findUnique({
        where: { organizationId_userId: { organizationId: existing.organizationId, userId: ctx.session.user.id } },
      })
      if (!member) throw new TRPCError({ code: "FORBIDDEN" })

      const isPrivileged = member.role === "owner" || member.role === "admin"

      let isTeamLeader = false
      if (!isPrivileged) {
        const ledTeam = await prisma.team.findFirst({
          where: { leaderId: member.id, organizationId: existing.organizationId },
        })
        isTeamLeader = !!ledTeam
      }

      if (!isPrivileged && !isTeamLeader && existing.authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }

      await prisma.kbItem.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
