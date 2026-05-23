"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const handleEmailSignIn = useCallback(
    async (data: LoginForm) => {
      setError(null)
      setLoading(true)
      const res = await authClient.signIn.email(data)
      if (res.error) {
        setError(
          res.error.message ||
            res.error.statusText ||
            "Invalid email or password.",
        )
        setLoading(false)
        return
      }

      // Auto-redirect if user has orgs
      try {
        const { data: orgs } = await authClient.organization.list()

        if (orgs && orgs.length > 0) {
          const org = orgs[0]
          await authClient.organization.setActive({ organizationId: org.id })
          const { data: member } =
            await authClient.organization.getActiveMember()
          const role =
            member && typeof member === "object" && "role" in member
              ? (member as { role: string }).role
              : null
          if (role === "owner" || role === "admin")
            router.replace(`/${org.slug}`)
          else if (role === "team_leader")
            router.replace(`/${org.slug}/manage-team`)
          else if (role === "pending") router.replace(`/${org.slug}/org`)
          else router.replace(`/${org.slug}/team`)
          return
        }
      } catch {}

      router.push("/onboard")
    },
    [router],
  )

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true)
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/onboard",
    })
  }, [])

  const handlePasskeySignIn = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await authClient.signIn.passkey()
    if (res?.error) {
      setError(res.error.message || "Passkey sign-in failed.")
      setLoading(false)
      return
    }

    try {
      const { data: orgs } = await authClient.organization.list()
      if (orgs && orgs.length > 0) {
        const org = orgs[0]
        await authClient.organization.setActive({ organizationId: org.id })
        const { data: member } = await authClient.organization.getActiveMember()
        const role =
          member && typeof member === "object" && "role" in member
            ? (member as { role: string }).role
            : null
        if (role === "owner" || role === "admin") router.replace(`/${org.slug}`)
        else if (role === "team_leader")
          router.replace(`/${org.slug}/manage-team`)
        else if (role === "pending") router.replace(`/${org.slug}/org`)
        else router.replace(`/${org.slug}/team`)
        return
      }
    } catch {}

    router.push("/onboard")
  }, [router])

  return (
    <div className="w-full max-w-sm mx-auto">
      <h2 className="text-lg font-semibold text-foreground">Sign in</h2>
      <p className="mb-8 mt-1 text-sm text-muted-foreground">
        Sign in to your account to continue.
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleEmailSignIn)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in with email"}
          </Button>
        </form>
      </Form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full gap-3"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <GoogleIcon />
          Sign in with Google
        </Button>
        <Button
          variant="outline"
          className="w-full gap-3"
          onClick={handlePasskeySignIn}
          disabled={loading}
        >
          <PasskeyIcon />
          Sign in with passkey
        </Button>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/register"
          className="text-foreground underline underline-offset-4 hover:text-muted-foreground"
        >
          Create one
        </Link>
      </p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="size-4"
      fill="currentColor"
    >
      <title>Google Icon</title>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function PasskeyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Lock Icon</title>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="12" cy="16" r="1" />
    </svg>
  )
}
