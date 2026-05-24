"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"

export function ForgotPasswordForm({ callbackURL }: { callbackURL?: string }) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!email) return
      setError(null)
      setSent(false)
      setLoading(true)
      try {
        await authClient.$fetch("/request-password-reset", {
          method: "POST",
          body: { email, redirectTo: "/auth/reset-password" },
        })
        setSent(true)
      } catch (err: any) {
        setError(err?.message ?? "Failed to send reset email.")
      } finally {
        setLoading(false)
      }
    },
    [email],
  )

  if (sent) {
    return (
      <div className="w-full max-w-sm mx-auto">
        <h2 className="text-lg font-semibold text-foreground">Check your inbox</h2>
        <p className="mb-8 mt-1 text-sm text-muted-foreground">
          If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset link shortly.
        </p>
        <p className="text-xs text-muted-foreground">
          <Link
            href={`/auth/login${callbackURL ? `?callbackURL=${encodeURIComponent(callbackURL)}` : ""}`}
            className="text-foreground underline underline-offset-4 hover:text-muted-foreground"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <h2 className="text-lg font-semibold text-foreground">Forgot password</h2>
      <p className="mb-8 mt-1 text-sm text-muted-foreground">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </Field>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading || !email}>
          {loading ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        <Link
          href={`/auth/login${callbackURL ? `?callbackURL=${encodeURIComponent(callbackURL)}` : ""}`}
          className="text-foreground underline underline-offset-4 hover:text-muted-foreground"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
