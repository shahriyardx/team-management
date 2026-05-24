"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthPageLayout } from "@/components/auth/auth-page-layout"
import { BarChart3, BookOpen, ListChecks, Users } from "lucide-react"

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
      await authClient.organization.acceptInvitation({ invitationId: inviteCode.trim() })

      const { data: orgs } = await authClient.organization.list()
      if (orgs && orgs.length > 0) {
        const org = orgs[0]
        await authClient.organization.setActive({ organizationId: org.id })
        const { data: member } = await authClient.organization.getActiveMember()
        const role = member && typeof member === "object" && "role" in member
          ? (member as { role: string }).role
          : "member"
        if (role === "owner" || role === "admin") router.replace(`/${org.slug}`)
        else if (role === "team_leader") router.replace(`/${org.slug}/manage-team`)
        else if (role === "pending") router.replace(`/${org.slug}/org`)
        else router.replace(`/${org.slug}/team`)
        return
      }

      router.replace("/onboard")
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to join organization.")
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
        <div className="w-full max-w-2xl mx-auto space-y-6">
          <h2 className="text-lg font-semibold text-foreground text-center">Get started with WeirdTeams</h2>
          <p className="mt-1 text-xs text-muted-foreground text-center">
            Create your own organization or join an existing one.
          </p>
          <div className="border border-border p-6">
            <h3 className="text-sm font-semibold text-foreground">Create an organization</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Set up a new workspace for your team.
            </p>
            <Button className="mt-4 w-full" size="sm" onClick={() => router.push("/onboard/add-organization")}>
              Create
            </Button>
          </div>
          <div className="border border-border p-6">
            <h3 className="text-sm font-semibold text-foreground">Join an organization</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Enter your invitation code to join a team.
            </p>
            <div className="mt-4 space-y-3">
              <Input
                placeholder="Invitation code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
              {inviteError && <p className="text-xs text-destructive">{inviteError}</p>}
              <Button className="w-full" size="sm" onClick={handleJoin} disabled={joining}>
                {joining ? "Joining..." : "Join"}
              </Button>
            </div>
          </div>
        </div>
      }
    />
  )
}
