"use client"

import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Target, UsersThree, ListChecks } from "@phosphor-icons/react"

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

export default function OwnerDashboard() {
  const { organization } = useOrganization()

  const { data: stats } = api.dashboard.orgStats.useQuery(
    { organizationId: organization?.id ?? "" },
    { enabled: !!organization },
  )

  if (!organization) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <Skeleton className="size-8 rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{organization.name}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Organization overview.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard icon={UsersThree} label="Members" value={stats?.memberCount ?? "—"} color="text-emerald-500" />
        <StatCard icon={Target} label="Cycles" value={stats?.cycleCount ?? "—"} color="text-amber-500" />
        <StatCard icon={ListChecks} label="Total Tasks" value={stats?.taskCount ?? "—"} color="text-violet-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border border-border p-4">
          <h2 className="text-sm font-medium mb-3">Quick Links</h2>
          <div className="space-y-2">
            <a href="okr" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">→ Org OKRs</a>
            <a href="okr/cycles" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">→ OKR Cycles</a>
            <a href="okr/team" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">→ Team OKR Assignments</a>
            <a href="knowledge-base" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">→ Knowledge Base</a>
            <a href="teams" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">→ Manage Teams</a>
            <a href="members" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">→ Members</a>
          </div>
        </div>
        <div className="border border-border p-4">
          <h2 className="text-sm font-medium mb-3">Organization Info</h2>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Slug: {organization.slug}</p>
            <p>ID: {organization.id}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
