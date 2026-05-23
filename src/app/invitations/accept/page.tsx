"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, X } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { PublicHeader } from "@/components/public-header"
import { Footer } from "@/components/footer"

function AcceptContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invitationId = searchParams.get("id")
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  )
  const [error, setError] = useState("")

  const accept = useCallback(async () => {
    if (!invitationId) {
      setStatus("error")
      setError("Invalid invitation link.")
      return
    }

    const { data: session } = await authClient.getSession()
    if (!session) {
      router.replace(`/?invitation=${invitationId}`)
      return
    }

    try {
      await authClient.organization.acceptInvitation({ invitationId })
      setStatus("success")
      setTimeout(() => router.replace("/onboard"), 2000)
    } catch (err: unknown) {
      setStatus("error")
      setError(
        err instanceof Error ? err.message : "Failed to accept invitation.",
      )
    }
  }, [invitationId, router])

  useEffect(() => {
    accept()
  }, [accept])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm rounded-none border border-border p-8 text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-3">
            <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
            <p className="text-xs text-muted-foreground">
              Accepting invitation...
            </p>
          </div>
        )}
        {status === "success" && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-green-50 text-green-700 ring-1 ring-green-200 dark:bg-green-950/30 dark:text-green-400 dark:ring-green-800">
              <Check className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Invitation accepted!
            </p>
            <p className="text-xs text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </div>
        )}
        {status === "error" && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-800">
              <X className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Invitation failed
            </p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => router.replace("/onboard")}
            >
              Go to dashboard
            </Button>
          </div>
        )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        </div>
      }
    >
      <AcceptContent />
    </Suspense>
  )
}
