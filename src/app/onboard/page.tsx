"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { useOrgRedirect } from "@/hooks/use-org-redirect"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthPageLayout } from "@/components/auth/auth-page-layout"
import { ArrowRight, BarChart3, BookOpen, Building, ListChecks, UserPlus, Users } from "lucide-react"

type Org = { id: string; name: string; slug: string; logo?: string | null }

const features = [
  {
    icon: ListChecks,
    title: "Team Tasks",
    description: "Create, assign, and track tasks across your team in real time.",
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    description: "Centralized docs, guides, and resources for your entire team.",
  },
  {
    icon: Users,
    title: "Member Management",
    description: "Manage roles, permissions, and onboarding in one place.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Track progress, velocity, and team performance over time.",
  },
]

function LeftPanel() {
  return (
    <>
      <div>
        <h1 className="text-4xl font-bold tracking-[0.15em] text-white sm:text-5xl">WEIRDTEAMS</h1>
        <p className="mt-2 text-sm text-zinc-400">Your team, in sync.</p>
      </div>
      <div className="my-16 space-y-10 lg:my-0">
        {features.map((f) => (
          <div key={f.title} className="group flex gap-4">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-white/5 text-zinc-400 transition-colors group-hover:bg-white/10 group-hover:text-white">
              <f.icon className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{f.description}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-zinc-600">&copy; 2026 WeirdTeams</p>
    </>
  )
}

export default function OnboardPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const { redirectToFirstOrg } = useOrgRedirect()
  const [, setOrgs] = useState<Org[]>([])
  const [inviteCode, setInviteCode] = useState("")
  const [inviteError, setInviteError] = useState("")
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (isPending) return
    if (!session) { router.replace("/auth/login"); return }

    authClient.organization.list().then((res) => {
      setOrgs(res.data ?? [])
    })
  }, [session, isPending, router])

  const handleJoin = useCallback(async () => {
    if (!inviteCode.trim()) return
    setJoining(true)
    setInviteError("")
    try {
      const { error: acceptError } = await authClient.organization.acceptInvitation({ invitationId: inviteCode.trim() })
      if (acceptError) {
        setInviteError(acceptError.message || "Failed to accept invitation.")
        setJoining(false)
        return
      }

      await redirectToFirstOrg("/onboard")
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Something went wrong.")
      setJoining(false)
    }
  }, [inviteCode, router])

  if (isPending || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  return (
    <AuthPageLayout
      left={<LeftPanel />}
      right={
        <div className="w-full max-w-xl mx-auto px-8 py-24">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-xl font-bold text-foreground">Get started with WeirdTeams</h2>
            <p className="text-sm text-muted-foreground">
              Set up your workspace or join an existing team.
            </p>
          </div>
          <div className="mt-14 space-y-10">
            <div className="border border-border p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-9 shrink-0 items-center justify-center border border-border bg-accent">
                  <Building className="size-4 text-foreground" />
                </div>
                <div className="w-px self-stretch bg-border" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">Create an organization</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">Set up a new workspace for your team.</p>
                </div>
              </div>
              <div className="mt-6">
                <Button
                  onClick={() => router.push("/onboard/add-organization")}
                  className="h-10 px-5 bg-foreground text-background hover:bg-foreground/90 border-0"
                >
                  Create workspace
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            </div>
            <div className="border border-border p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-9 shrink-0 items-center justify-center border border-border bg-accent">
                  <UserPlus className="size-4 text-foreground" />
                </div>
                <div className="w-px self-stretch bg-border" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">Join an organization</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">Enter your invitation code to join a team.</p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <Input
                  placeholder="Invitation code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="h-10"
                />
                {inviteError && <p className="text-xs text-destructive">{inviteError}</p>}
                <Button
                  onClick={handleJoin}
                  disabled={joining}
                  className="h-10 px-5 bg-foreground text-background hover:bg-foreground/90 border-0"
                >
                  {joining ? "Joining..." : "Join organization"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      }
    />
  )
}
