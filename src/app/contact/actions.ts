"use server"

import { sendContactEmail } from "@/lib/email"

type ContactState = { error?: string; success?: boolean } | null

export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const subject = formData.get("subject") as string
  const message = formData.get("message") as string

  if (!name || !email || !subject || !message) {
    return { error: "All fields are required." }
  }

  if (!email.includes("@")) {
    return { error: "Invalid email address." }
  }

  try {
    await sendContactEmail({ name, email, subject, message })
    return { success: true }
  } catch {
    return { error: "Failed to send message. Please try again later." }
  }
}
