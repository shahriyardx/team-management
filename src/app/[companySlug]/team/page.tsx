"use client"

import { useOrganization } from "@/lib/organization-context"
import { useMemberRole } from "@/lib/use-member-role"
import { api } from "@/lib/trpc/client"
import { Skeleton } from "@/components/ui/skeleton"
import { ListChecks, Target } from "@phosphor-icons/react"

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

export default function MemberDashboardPage() {
  const { organization } = useOrganization()
  const { loading } = useMemberRole()

  const { data: stats } = api.dashboard.memberStats.useQuery(
    { organizationId: organization?.id ?? "" },
    { enabled: !!organization },
  )

  if (loading || !organization) {
    return <div className="flex flex-1 flex-col gap-6 p-6">
      <Skeleton className="h-6 w-48" />
      <div className="grid grid-cols-2 gap-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24" />)}</div>
    </div>
  }

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
          <a href="okr" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">→ My OKRs</a>
          <a href="tasks" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">→ My Tasks</a>
        </div>
      </div>
    </div>
  )
}
