import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { prisma } from "@/lib/prisma"
import { router, protectedProcedure } from "./server"

export const notificationRouter = router({
  listUnread: protectedProcedure
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

      const notifications = await prisma.notification.findMany({
        where: {
          userId: ctx.session.user.id,
          organizationId: input.organizationId,
          read: false,
        },
        include: {
          task: { select: { id: true, title: true } },
          kbItem: { select: { id: true, title: true, teamId: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
      return { notifications }
    }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await prisma.notification.findUnique({ where: { id: input.id } })
      if (!notification || notification.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }
      await prisma.notification.update({ where: { id: input.id }, data: { read: true } })
      return { success: true }
    }),

  markAllRead: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.notification.updateMany({
        where: { userId: ctx.session.user.id, organizationId: input.organizationId, read: false },
        data: { read: true },
      })
      return { success: true }
    }),
})
