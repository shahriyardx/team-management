"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Check, Clock, User, Envelope, Buildings } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

type InviteInfo = {
  org: string
  slug: string
  role: string
  inviter: string
  email: string
}

type State =
  | { phase: "loading" }
  | { phase: "ready"; info: InviteInfo }
  | { phase: "accepting"; info: InviteInfo }
  | { phase: "success"; slug: string }
  | { phase: "error"; message: string }

function AcceptContent() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const invitationId = params.id
  const acceptedRef = useRef(false)

  const [state, setState] = useState<State>({ phase: "loading" })

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: session } = await authClient.getSession()
      if (!session) {
        router.replace(`/?invitation=${invitationId}`)
        return
      }
      if (cancelled) return

      const res = await authClient.$fetch("/organization/get-invitation", {
        method: "GET",
        query: { id: invitationId },
      })
      const r = res as { data: InviteInfoRaw | null; error: { message: string } | null }
      if (r.error || !r.data) {
        if (!cancelled) setState({ phase: "error", message: r.error?.message ?? "Invitation not found or has expired." })
        return
      }
      if (!cancelled) {
        setState({
          phase: "ready",
          info: {
            org: r.data.organizationName,
            slug: r.data.organizationSlug,
            role: r.data.role,
            inviter: r.data.inviterEmail,
            email: r.data.email,
          },
        })
      }
    }

    load()
    return () => { cancelled = true }
  }, [invitationId, router])

  const handleAccept = useCallback(async () => {
    if (acceptedRef.current) return
    if (state.phase !== "ready") return
    acceptedRef.current = true
    setState({ phase: "accepting", info: state.info })

    try {
      await authClient.organization.acceptInvitation({ invitationId })
      setState({ phase: "success", slug: state.info.slug })
      setTimeout(() => router.replace(`/${state.info.slug}`), 2000)
    } catch (err: unknown) {
      acceptedRef.current = false
      const message = err instanceof Error ? err.message : "Failed to accept invitation."
      setState({ phase: "error", message })
    }
  }, [invitationId, state, router])

  const formatRole = (r: string) =>
    r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  if (state.phase === "loading") {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  if (state.phase === "success") {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-50 text-green-700 ring-1 ring-green-200 dark:bg-green-950/30 dark:text-green-400 dark:ring-green-800">
          <Check className="size-6" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">You&apos;re in!</h2>
        <p className="mt-2 text-sm text-muted-foreground">Redirecting to your workspace...</p>
      </div>
    )
  }

  if (state.phase === "error") {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-800">
          <Clock className="size-6" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Unable to accept</h2>
        <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
      </div>
    )
  }

  const info = state.info

  return (
    <div>
      <div className="mb-6">
        <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Buildings className="size-5" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          You&apos;re invited to <span className="text-primary">{info.org}</span>
        </h2>
      </div>

      <div className="mb-6 space-y-3 rounded-lg border border-border bg-muted/50 p-4">
        <div className="flex items-center gap-3 text-sm">
          <User className="size-4 shrink-0 text-muted-foreground" />
          <span>
            Invited by <span className="font-medium text-foreground">{info.inviter}</span>
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Envelope className="size-4 shrink-0 text-muted-foreground" />
          <span>
            For <span className="font-medium text-foreground">{info.email}</span>
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Buildings className="size-4 shrink-0 text-muted-foreground" />
          <span>
            Role: <span className="font-medium text-foreground">{formatRole(info.role)}</span>
          </span>
        </div>
      </div>

      {state.phase === "ready" && (
        <>
          <Button className="w-full" onClick={handleAccept}>
            Accept invitation
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Not expecting this? You can ignore this invitation.
          </p>
        </>
      )}

      {state.phase === "accepting" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
          <p className="text-sm text-muted-foreground">Accepting invitation...</p>
        </div>
      )}
    </div>
  )
}

type InviteInfoRaw = {
  organizationName: string
  organizationSlug: string
  role: string
  inviterEmail: string
  email: string
}

export default function InvitationPage() {
  return <AcceptContent />
}
