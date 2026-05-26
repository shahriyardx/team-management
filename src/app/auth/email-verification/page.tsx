"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

const COOLDOWN = 60

export default function EmailVerificationPageWrapper() {
  return (
    <Suspense fallback={null}>
      <EmailVerificationPage />
    </Suspense>
  )
}

function EmailVerificationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") ?? ""
  const [sending, setSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const handleResend = useCallback(async () => {
    if (!email || cooldown > 0) return
    setSending(true)
    setError(null)
    const res = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/auth/login",
    })
    setSending(false)
    if (res.error) {
      setError(res.error.message || res.error.statusText || "Failed to resend.")
      return
    }

    setCooldown(COOLDOWN)
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [email, cooldown])

  return (
    <div className="w-full max-w-sm mx-auto">
      <button
        onClick={() => router.push("/auth/login")}
        className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Back to sign in
      </button>

      <h2 className="text-lg font-semibold text-foreground">
        Verify your email
      </h2>
      <p className="mb-8 mt-1 text-sm text-muted-foreground">
        You need to verify your email before signing in.
      </p>

      <div className="border border-border bg-accent/30 p-4 text-xs text-muted-foreground space-y-2">
        {email ? (
          <p>
            A verification link was sent to <strong>{email}</strong>. Click the
            link to activate your account.
          </p>
        ) : (
          <p>Your email address needs to be verified.</p>
        )}
        <p>Didn&apos;t receive it? Check your spam folder.</p>
      </div>

      <div className="mt-6 space-y-3">
        <Button
          onClick={handleResend}
          disabled={sending || cooldown > 0}
          className="w-full"
        >
          {sending
            ? "Sending..."
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend verification email"}
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}
