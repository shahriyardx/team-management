import type { Resend as ResendType } from "resend"
import { render } from "@react-email/components"
import { InvitationEmail } from "@/emails/invitation"

const FROM = "Pulse <noreply@pulse.app>"

let _resend: ResendType | undefined

async function getResend() {
  if (!_resend) {
    const { Resend } = await import("resend")
    _resend = new Resend(process.env.RESEND_API_KEY as string)
  }
  return _resend
}

export async function sendInvitationEmail({
  to,
  organizationName,
  inviterName,
  role,
  acceptUrl,
}: {
  to: string
  organizationName: string
  inviterName: string
  role: string
  acceptUrl: string
}) {
  if (!process.env.RESEND_API_KEY) return

  const html = await render(
    <InvitationEmail
      organizationName={organizationName}
      inviterName={inviterName}
      role={role}
      acceptUrl={acceptUrl}
    />,
  )

  const resend = await getResend()
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `You've been invited to ${organizationName}`,
    html,
  })

  if (error) throw error
}
