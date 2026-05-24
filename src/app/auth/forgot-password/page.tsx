import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export default async function ForgotPasswordPage(props: {
  searchParams: Promise<{ callbackURL?: string }>
}) {
  const { callbackURL } = await props.searchParams
  return <ForgotPasswordForm callbackURL={callbackURL} />
}
