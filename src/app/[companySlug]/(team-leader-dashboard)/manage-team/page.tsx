"use client"

import { useOrganization } from "@/lib/organization-context"
import { useMemberRole } from "@/lib/use-member-role"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/trpc/client"
import { Skeleton } from "@/components/ui/skeleton"
import { ListChecks, Target, UsersThree } from "@phosphor-icons/react"

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
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

export default function TeamLeaderDashboardPage() {
  const { organization } = useOrganization()
  const { loading } = useMemberRole()
  const { data: session } = authClient.useSession()
  const activeTeamId = session?.session?.activeTeamId

  const { data: team } = api.team.getById.useQuery(
    { teamId: activeTeamId ?? "", organizationId: organization?.id ?? "" },
    { enabled: !!organization && !!activeTeamId },
  )
  const { data: stats } = api.dashboard.teamStats.useQuery(
    { teamId: activeTeamId ?? "", organizationId: organization?.id ?? "" },
    { enabled: !!organization && !!activeTeamId },
  )

  if (loading || !organization) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  if (!activeTeamId) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-xs text-muted-foreground">
          No active team selected. Switch teams using the team dropdown.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          {team?.team?.name ?? "Team Dashboard"}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your team overview.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          icon={UsersThree}
          label="Members"
          value={team?.team?.members.length ?? "—"}
          color="text-emerald-500"
        />
        <StatCard
          icon={Target}
          label="Team OKR Progress"
          value={stats ? `${stats.okrProgress}%` : "—"}
          color="text-amber-500"
        />
        <StatCard
          icon={ListChecks}
          label="Team Tasks"
          value={stats?.taskCount ?? "—"}
          color="text-violet-500"
        />
      </div>

      <div className="border border-border p-4">
        <h2 className="text-sm font-medium mb-3">Team Members</h2>
        {team?.team?.members && team.team.members.length > 0 ? (
          <div className="space-y-2">
            {team.team.members.map(
              (tm: { id: string; user: { id: string; name: string } }) => (
                <div key={tm.id} className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-foreground">
                    {tm.user.name}
                  </span>
                  {team.team?.leader?.user?.id === tm.user.id && (
                    <span className="text-muted-foreground">(leader)</span>
                  )}
                </div>
              ),
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No members in this team.
          </p>
        )}
      </div>
    </div>
  )
}
