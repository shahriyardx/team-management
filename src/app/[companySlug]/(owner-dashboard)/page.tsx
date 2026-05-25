"use client"

import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Buildings, UsersThree, ListChecks } from "@phosphor-icons/react"
import { StorageChart } from "@/components/dashboard/storage-chart"
import { Skeleton } from "@/components/ui/skeleton"

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
    <Card size="sm">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Icon className={`size-4 ${color}`} />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
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
        <h1 className="text-lg font-semibold text-foreground">
          {organization.name}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Organization overview.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={UsersThree}
          label="Members"
          value={stats?.memberCount ?? "—"}
          color="text-emerald-500"
        />
        <StatCard
          icon={Buildings}
          label="Teams"
          value={stats?.teamCount ?? "—"}
          color="text-amber-500"
        />
        <StatCard
          icon={ListChecks}
          label="Total Tasks"
          value={stats?.taskCount ?? "—"}
          color="text-violet-500"
        />
        {stats && (
          <StorageChart
            storageUsed={stats.storageUsed}
            storageLimit={stats.storageLimit}
          />
        )}
      </div>
    </div>
  )
}
