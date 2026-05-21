import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { prisma } from "@/lib/prisma"
import { router, protectedProcedure } from "./server"

export const labelRouter = router({
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

      const labels = await prisma.label.findMany({
        where: { organizationId: input.organizationId },
        orderBy: { name: "asc" },
      })
      return { labels }
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        color: z.string().optional(),
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

      const label = await prisma.label.create({
        data: {
          name: input.name,
          color: input.color ?? "#6366f1",
          organizationId: input.organizationId,
        },
      })
      return { label }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const label = await prisma.label.findUnique({
        where: { id: input.id },
        include: { organization: { include: { members: { where: { userId: ctx.session.user.id } } } } },
      })
      if (!label) throw new TRPCError({ code: "NOT_FOUND" })
      const member = label.organization.members[0]
      if (!member || (member.role !== "admin" && member.role !== "owner")) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }
      await prisma.label.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
