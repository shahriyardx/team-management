import { z } from "zod"
import { router, publicProcedure } from "./server"
import { sendContactEmail } from "@/lib/email"

const contactInput = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().min(1, "Email is required.").email("Invalid email address."),
  subject: z.string().min(1, "Subject is required."),
  message: z.string().min(1, "Message is required."),
})

export const contactRouter = router({
  submit: publicProcedure.input(contactInput).mutation(async ({ input }) => {
    try {
      await sendContactEmail(input)
      return { success: true }
    } catch {
      throw new Error("Failed to send message. Please try again later.")
    }
  }),
})
