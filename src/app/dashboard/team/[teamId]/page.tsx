"use client"

import { use } from "react"
import { useOrganization } from "@/lib/organization-context"
import { useMemberRole } from "@/lib/use-member-role"
import { api } from "@/lib/trpc/client"
import { Skeleton } from "@/components/ui/skeleton"
import { ListChecks, Target, UsersThree } from "@phosphor-icons/react"

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

function TeamLeaderDashboard({ orgId, teamId }: { orgId: string; teamId: string }) {
  const { data: team } = api.team.getById.useQuery({ teamId, organizationId: orgId })
  const { data: stats } = api.dashboard.teamStats.useQuery({ teamId, organizationId: orgId })

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          {team?.team.name ?? "Team Dashboard"}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your team overview.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard icon={UsersThree} label="Members" value={team?.team.members.length ?? "—"} color="text-emerald-500" />
        <StatCard icon={Target} label="Team OKR Progress" value={stats ? `${stats.okrProgress}%` : "—"} color="text-amber-500" />
        <StatCard icon={ListChecks} label="Team Tasks" value={stats?.taskCount ?? "—"} color="text-violet-500" />
      </div>

      <div className="border border-border p-4">
        <h2 className="text-sm font-medium mb-3">Team Members</h2>
        {team?.team.members && team.team.members.length > 0 ? (
          <div className="space-y-2">
            {team.team.members.map((tm) => (
              <div key={tm.id} className="flex items-center gap-2 text-xs">
                <span className="font-medium text-foreground">{tm.user.name}</span>
                {team.team.leader?.user?.id === tm.user.id && (
                  <span className="text-muted-foreground">(leader)</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No members in this team.</p>
        )}
      </div>

      <div className="border border-border p-4">
        <h2 className="text-sm font-medium mb-3">Quick Links</h2>
        <div className="space-y-2">
          <a href={`/dashboard/team/${teamId}/okrs/team`} className="block text-xs text-muted-foreground hover:text-foreground transition-colors">→ Team OKRs</a>
          <a href={`/dashboard/team/${teamId}/tasks`} className="block text-xs text-muted-foreground hover:text-foreground transition-colors">→ My Tasks</a>
          <a href={`/dashboard/team/${teamId}/tasks/all`} className="block text-xs text-muted-foreground hover:text-foreground transition-colors">→ All Team Tasks</a>
        </div>
      </div>
    </div>
  )
}

function MemberDashboard({ orgId, teamId }: { orgId: string; teamId: string }) {
  const { data: stats } = api.dashboard.memberStats.useQuery({ organizationId: orgId })

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your personal overview.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard icon={Target} label="My OKR Progress" value={stats ? `${stats.okrProgress}%` : "—"} color="text-amber-500" />
        <StatCard icon={ListChecks} label="My Tasks" value={stats?.taskCount ?? "—"} color="text-violet-500" />
      </div>

      <div className="border border-border p-4">
        <h2 className="text-sm font-medium mb-3">Quick Links</h2>
        <div className="space-y-2">
          <a href={`/dashboard/team/${teamId}/okrs`} className="block text-xs text-muted-foreground hover:text-foreground transition-colors">→ My OKRs</a>
          <a href={`/dashboard/team/${teamId}/tasks`} className="block text-xs text-muted-foreground hover:text-foreground transition-colors">→ My Tasks</a>
        </div>
      </div>
    </div>
  )
}

export default function TeamDashboardPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { organization } = useOrganization()
  const { role, loading } = useMemberRole()

  if (loading || !organization) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  const { teamId } = use(params)

  if (role === "team_leader") {
    return <TeamLeaderDashboard orgId={organization.id} teamId={teamId} />
  }

  return <MemberDashboard orgId={organization.id} teamId={teamId} />
}
