import type { Resend as ResendType } from "resend"
import { render } from "@react-email/components"
import { InvitationEmail } from "@/emails/invitation"
import { VerifyEmail } from "@/emails/verify-email"
import { ResetPasswordEmail } from "@/emails/reset-password"

const FROM = "WeirdTeams <noreply@weirdsoft.co.uk>"

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

export async function sendVerificationEmail({
  to,
  url,
}: {
  to: string
  url: string
}) {
  if (!process.env.RESEND_API_KEY) return

  const html = await render(<VerifyEmail url={url} />)

  const resend = await getResend()
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Verify your email address",
    html,
  })

  if (error) throw error
}

export async function sendResetPasswordEmail({
  to,
  url,
}: {
  to: string
  url: string
}) {
  if (!process.env.RESEND_API_KEY) return

  const html = await render(<ResetPasswordEmail url={url} />)

  const resend = await getResend()
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your password",
    html,
  })

  if (error) throw error
}
