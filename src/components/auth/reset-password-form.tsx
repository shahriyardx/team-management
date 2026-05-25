"use client"

import { useCallback, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { authClient } from "@/lib/auth-client"

const resetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirm: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  })

type ResetForm = z.infer<typeof resetSchema>

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null

  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
  const score = Object.values(checks).filter(Boolean).length

  const colors = [
    "bg-destructive",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
  ]
  const labels = ["Weak", "Fair", "Good", "Strong", "Very strong"]
  const labelColor = [
    "text-destructive",
    "text-orange-500",
    "text-yellow-500",
    "text-lime-500",
    "text-green-500",
  ]

  return (
    <div className="space-y-1 mt-1">
      <div className="flex gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-sm transition-colors ${i < score ? colors[i] : "bg-border"}`}
          />
        ))}
      </div>
      <p
        className={`text-[10px] ${labelColor[score - 1] ?? "text-muted-foreground"}`}
      >
        {labels[score - 1]}
      </p>
    </div>
  )
}

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirm: "" },
  })
  const watchPassword = form.watch("password")

  const handleSubmit = useCallback(
    async (data: ResetForm) => {
      if (!token) {
        setError("Invalid or missing reset token.")
        return
      }

      setError(null)
      setLoading(true)
      try {
        await authClient.$fetch("/reset-password", {
          method: "POST",
          body: { newPassword: data.password, token },
        })
        router.push("/auth/login")
      } catch (err: any) {
        const message = err?.message ?? err?.statusText ?? ""
        if (message.toLowerCase().includes("token")) {
          setError("This reset link has expired or is invalid.")
        } else if (message) {
          setError(message)
        } else {
          setError("Failed to reset password. The link may have expired.")
        }
      } finally {
        setLoading(false)
      }
    },
    [token, router],
  )

  if (!token) {
    return (
      <div className="w-full max-w-sm mx-auto">
        <h2 className="text-lg font-semibold text-foreground">Invalid link</h2>
        <p className="mb-8 mt-1 text-sm text-muted-foreground">
          This reset link is invalid or has expired.
        </p>
        <p className="text-xs text-muted-foreground">
          <Link
            href="/auth/forgot-password"
            className="text-foreground underline underline-offset-4 hover:text-muted-foreground"
          >
            Request a new reset link
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <h2 className="text-lg font-semibold text-foreground">
        Reset your password
      </h2>
      <p className="mb-8 mt-1 text-sm text-muted-foreground">
        Enter your new password below.
      </p>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <Field>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            {...form.register("password")}
            disabled={loading}
          />
          <PasswordStrength password={watchPassword} />
          {form.formState.errors.password && (
            <FieldError errors={[form.formState.errors.password]} />
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm">Confirm password</FieldLabel>
          <Input
            id="confirm"
            type="password"
            placeholder="Re-enter your new password"
            {...form.register("confirm")}
            disabled={loading}
          />
          {form.formState.errors.confirm && (
            <FieldError errors={[form.formState.errors.confirm]} />
          )}
        </Field>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Resetting..." : "Reset password"}
        </Button>
      </form>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        <Link
          href="/auth/login"
          className="text-foreground underline underline-offset-4 hover:text-muted-foreground"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
