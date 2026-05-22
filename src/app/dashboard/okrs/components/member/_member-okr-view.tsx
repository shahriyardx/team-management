"use client"

import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"
import { Skeleton } from "@/components/ui/skeleton"
import { MemberObjectiveCard } from "./_member-objective-card"

interface MemberOkrViewProps {
  cycleId: string
  locked?: boolean
}

export function MemberOkrView({ cycleId, locked }: MemberOkrViewProps) {
  const { session, organization } = useOrganization()

  const { data: objectivesData, isLoading } = api.objective.list.useQuery(
    { cycleId, organizationId: organization?.id ?? "" },
    { enabled: !!organization },
  )
  const objectives = (objectivesData?.objectives ?? []) as Array<{
    id: string
    title: string
    description: string | null
    progress: number
    status: string
    ownerId: string
    owner: { id: string; user: { id: string; name: string; email: string; image?: string | null } }
    keyResults: Array<{
      id: string
      title: string
      description: string | null
      progress: number
      currentValue: number
      targetValue: number
      maxValue: number | null
      unit: string
      status: string
      ownerId: string
    }>
  }>

  const avgProgress =
    objectives.length > 0
      ? Math.round(objectives.reduce((s: number, o: { progress: number }) => s + o.progress, 0) / objectives.length)
      : 0
  const countByStatus = (statuses: string[]) =>
    objectives.filter((o: { status: string }) => statuses.includes(o.status)).length
  const onTrackCount = countByStatus(["on_track", "completed"])
  const atRiskCount = countByStatus(["at_risk"])
  const behindCount = countByStatus(["behind"])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
        {[1, 2].map((i) => <Skeleton key={i} className="h-32" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="border border-border p-3">
          <p className="text-xs text-muted-foreground">Avg Progress</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{avgProgress}%</p>
        </div>
        <div className="border border-border p-3">
          <p className="text-xs text-muted-foreground">On Track</p>
          <p className="mt-1 text-lg font-semibold text-emerald-500">{onTrackCount}</p>
        </div>
        <div className="border border-border p-3">
          <p className="text-xs text-muted-foreground">At Risk</p>
          <p className="mt-1 text-lg font-semibold text-amber-400">{atRiskCount}</p>
        </div>
        <div className="border border-border p-3">
          <p className="text-xs text-muted-foreground">Behind</p>
          <p className="mt-1 text-lg font-semibold text-red-400">{behindCount}</p>
        </div>
      </div>

      {objectives.length === 0 ? (
        <div className="border border-border p-8 text-center text-xs text-muted-foreground">
          No objectives assigned to you yet.
        </div>
      ) : (
        <div className="space-y-4">
          {objectives.map((obj) => (
            <MemberObjectiveCard key={obj.id} cycleId={cycleId} locked={locked} objective={obj} />
          ))}
        </div>
      )}
    </div>
  )
}
