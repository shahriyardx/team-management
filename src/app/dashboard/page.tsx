"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useOrganization } from "@/lib/organization-context"
import { useMemberRole } from "@/lib/use-member-role"
import { api } from "@/lib/trpc/client"
import { Skeleton } from "@/components/ui/skeleton"
import { ListChecks, Target, Users, UsersThree } from "@phosphor-icons/react"

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className="border border-border p-4">
      <div className="flex items-center gap-2">
        <Icon className={`size-4 ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function AdminDashboard({ orgId }: { orgId: string }) {
  const { data: teams } = api.team.list.useQuery({ organizationId: orgId })
  const { data: stats } = api.dashboard.orgStats.useQuery({ organizationId: orgId })

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Admin Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Org-wide overview and management.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Members" value={stats?.memberCount ?? "—"} color="text-blue-500" />
        <StatCard icon={UsersThree} label="Teams" value={teams?.teams.length ?? "—"} color="text-emerald-500" />
        <StatCard icon={Target} label="OKR Cycles" value={stats?.cycleCount ?? "—"} color="text-amber-500" />
        <StatCard icon={ListChecks} label="Tasks" value={stats?.taskCount ?? "—"} color="text-violet-500" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-border p-4">
          <h2 className="text-sm font-medium mb-3">Quick Actions</h2>
          <div className="space-y-2">
            <a href="teams" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">→ Manage teams</a>
            <a href="members" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">→ Manage members</a>
            <a href="okrs" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">→ Manage OKRs</a>
            <a href="tasks" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">→ View tasks</a>
          </div>
        </div>
        <div className="border border-border p-4">
          <h2 className="text-sm font-medium mb-3">Recent Activity</h2>
          <p className="text-xs text-muted-foreground">Activity feed coming soon.</p>
        </div>
      </div>
    </div>
  )
}

function TeamRedirect({ orgId }: { orgId: string }) {
  const router = useRouter()
  const { data, isLoading } = api.team.getMyTeams.useQuery({ organizationId: orgId })

  const teams = data?.teams ?? []

  useEffect(() => {
    if (teams.length > 0) {
      router.replace(`/dashboard/team/${teams[0].id}`)
    }
  }, [teams, router])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
      <UsersThree className="size-10 text-muted-foreground/40" />
      <div className="text-center max-w-sm">
        <h2 className="text-sm font-medium text-foreground">Welcome to the organization</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          You haven&apos;t been assigned to a team yet. The org owner or a team leader will add you once teams are set up.
        </p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { organization } = useOrganization()
  const { role, loading } = useMemberRole()

  if (loading || !organization) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  if (role === "owner" || role === "admin") {
    return <AdminDashboard orgId={organization.id} />
  }

  if (role === "pending") {
    router.replace("/dashboard/org")
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  // team_leader or member — redirect to their first team
  return <TeamRedirect orgId={organization.id} />
}
