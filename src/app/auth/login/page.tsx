import { LoginForm } from "@/components/auth/login-form"

export default async function LoginPage(props: {
  searchParams: Promise<{ callbackURL?: string }>
}) {
  const { callbackURL } = await props.searchParams
  return <LoginForm callbackURL={callbackURL} />
}
