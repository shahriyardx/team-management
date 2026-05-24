import { RegisterForm } from "@/components/auth/register-form"

export default async function RegisterPage(props: {
  searchParams: Promise<{ callbackURL?: string }>
}) {
  const { callbackURL } = await props.searchParams
  return <RegisterForm callbackURL={callbackURL} />
}
