import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { prisma } from "@/lib/prisma"
import { deleteFromR2 } from "@/lib/r2"
import { router, protectedProcedure } from "./server"

export const orgRouter = router({
  deleteOrg: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const member = await prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId: ctx.session.user.id,
          },
        },
      })
      if (!member || member.role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN" })
      }

      // Delete announcement attachments from R2
      const announcementAtts = await prisma.announcementAttachment.findMany({
        where: { announcement: { organizationId: input.organizationId } },
        select: { url: true },
      })
      for (const att of announcementAtts) await deleteFromR2(att.url)

      // Delete KB attachments from R2
      const kbAtts = await prisma.kbAttachment.findMany({
        where: { kbItem: { organizationId: input.organizationId } },
        select: { url: true },
      })
      for (const att of kbAtts) await deleteFromR2(att.url)

      await prisma.organization.delete({ where: { id: input.organizationId } })

      return { success: true }
    }),
})
