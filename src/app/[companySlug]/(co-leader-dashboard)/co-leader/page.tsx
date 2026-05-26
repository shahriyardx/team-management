"use client"

import { useOrganization } from "@/lib/organization-context"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/trpc/client"
import { Skeleton } from "@/components/ui/skeleton"
import { ListChecks, UsersThree } from "@phosphor-icons/react"

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

export default function CoLeaderDashboardPage() {
  const { organization } = useOrganization()
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

  if (!organization) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
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
          Co-leader overview.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={UsersThree}
          label="Members"
          value={team?.team?.members.length ?? "—"}
          color="text-amber-500"
        />
        <StatCard
          icon={ListChecks}
          label="Team Tasks"
          value={stats?.taskCount ?? "—"}
          color="text-violet-500"
        />
      </div>

      <div className="border border-border">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium">Team Members</h2>
        </div>
        {team?.team?.members && team.team.members.length > 0 ? (
          <div className="divide-y divide-border">
            {[...team.team.members]
              .sort((a, b) => {
                const aIsLeader = team.team?.leader?.user?.id === a.user.id
                const bIsLeader = team.team?.leader?.user?.id === b.user.id
                if (aIsLeader) return -1
                if (bIsLeader) return 1
                return 0
              })
              .map(
                (tm: {
                  id: string
                  user: {
                    id: string
                    name: string
                    email: string
                    image: string | null
                  }
                }) => {
                  const isLeader = team.team?.leader?.user?.id === tm.user.id
                  return (
                    <div
                      key={tm.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {tm.user.image ? (
                          <img
                            src={tm.user.image}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground">
                            {tm.user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {tm.user.name}
                          </span>
                          {isLeader && (
                            <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5">
                              Leader
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {tm.user.email}
                        </p>
                      </div>
                    </div>
                  )
                },
              )}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            No members in this team.
          </div>
        )}
      </div>
    </div>
  )
}
