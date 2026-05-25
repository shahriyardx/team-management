"use client"

import { useEffect, useMemo, useState } from "react"
import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { ObjectiveCard } from "@/components/okrs/objective-card"
import { CheckInKrRow } from "@/components/okrs/check-in-kr-row"

type OkrCycleItem = {
  id: string
  title: string
  status: string
  locked?: boolean
  startDate: string
  endDate: string
}

type OkrObjective = {
  id: string
  title: string
  description: string | null
  progress: number
  status: string
  keyResults: Array<{
    id: string
    title: string
    description: string | null
    progress: number
    currentValue: number
    targetValue: number
    maxValue: number | null
    unit: string
    weight: number
    status: string
    ownerId: string | null
  }>
}

export function TeamLeaderOkrView({ teamId }: { teamId: string }) {
  const { organization } = useOrganization()

  // All cycles for selector
  const { data: cyclesData, isLoading: isCyclesLoading } =
    api.okrCycle.listActive.useQuery(
      { organizationId: organization?.id ?? "", skip: 0, take: 25 },
      { enabled: !!organization },
    )
  const cycles = (cyclesData?.cycles ?? []) as OkrCycleItem[]
  const years = cyclesData?.years ?? [String(new Date().getFullYear())]
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>(
    String(new Date().getFullYear()),
  )

  const filteredCycles = useMemo(
    () => cycles.filter((c) => c.startDate?.startsWith(selectedYear)),
    [cycles, selectedYear],
  )

  // Auto-select cycle whose date range includes today, else first active
  useEffect(() => {
    if (!selectedCycleId && filteredCycles.length > 0) {
      const now = new Date()
      const current = filteredCycles.find((c) => {
        const s = new Date(c.startDate)
        const e = new Date(c.endDate)
        return s <= now && now <= e
      })
      if (current) {
        setSelectedCycleId(current.id)
        return
      }
      setSelectedCycleId(filteredCycles[0].id)
    }
  }, [filteredCycles, selectedCycleId])

  const cycleId = selectedCycleId ?? ""
  const selectedCycle = useMemo(
    () => filteredCycles.find((c) => c.id === selectedCycleId) ?? null,
    [filteredCycles, selectedCycleId],
  )
  const locked = !!selectedCycle?.locked

  const { data: objectivesData, isLoading } =
    api.objective.listTeamLevel.useQuery(
      { cycleId },
      { enabled: !!cycleId && !!organization },
    )
  const objectives = (objectivesData?.objectives ?? []) as OkrObjective[]

  const analytics = useMemo(() => {
    if (objectives.length === 0)
      return { avgProgress: 0, onTrack: 0, atRisk: 0, behind: 0, completed: 0 }
    const totalP = objectives.reduce((s, o) => s + o.progress, 0)
    const sf = (s: string) => objectives.filter((o) => o.status === s).length
    return {
      avgProgress: Math.round(totalP / objectives.length),
      onTrack: sf("on_track"),
      atRisk: sf("at_risk"),
      behind: sf("behind"),
      completed: sf("completed"),
    }
  }, [objectives])

  if (isLoading || isCyclesLoading || (!cycleId && filteredCycles.length > 0)) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  if (cycles.length === 0) {
    return (
      <div className="border border-border p-8 text-center text-xs text-muted-foreground">
        No active OKR cycle right now.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Team OKR</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Team-level objectives for the active cycle.
          </p>
          <p className="text-xs text-muted-foreground sm:hidden">
            {filteredCycles.find((c) => c.id === selectedCycleId)?.title ?? ""}
          </p>
        </div>
        <div className="hidden sm:flex flex-wrap items-center gap-3 shrink-0">
          <Select
            value={selectedYear}
            onValueChange={(v) => {
              setSelectedYear(v)
              setSelectedCycleId(null)
            }}
          >
            <SelectTrigger className="h-7 w-auto min-w-20 rounded-none text-xs">
              {selectedYear}
            </SelectTrigger>
            <SelectContent position="popper">
              {years.map((yr) => (
                <SelectItem key={yr} value={yr}>
                  {yr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedCycleId ?? ""}
            onValueChange={setSelectedCycleId}
          >
            <SelectTrigger className="h-7 w-auto min-w-32 rounded-none text-xs">
              <span className="truncate">
                {filteredCycles.find((c) => c.id === selectedCycleId)?.title ??
                  "Select cycle"}
              </span>
            </SelectTrigger>
            <SelectContent position="popper">
              {filteredCycles.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span>{c.title}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredCycles.length === 0 ? (
        <div className="border border-border p-8 text-center text-xs text-muted-foreground">
          No active OKR cycles in {selectedYear}.
        </div>
      ) : objectives.length === 0 ? (
        <div className="border border-border p-8 text-center text-xs text-muted-foreground">
          No team objectives in this cycle. Your org admin will assign them.
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="border border-border p-3">
              <p className="text-xs text-muted-foreground">Avg Progress</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {analytics.avgProgress}%
              </p>
            </div>
            <div className="border border-border p-3">
              <p className="text-xs text-muted-foreground">On Track</p>
              <p className="mt-1 text-lg font-semibold text-emerald-500">
                {analytics.onTrack}
              </p>
            </div>
            <div className="border border-border p-3">
              <p className="text-xs text-muted-foreground">At Risk</p>
              <p className="mt-1 text-lg font-semibold text-amber-400">
                {analytics.atRisk}
              </p>
            </div>
            <div className="border border-border p-3">
              <p className="text-xs text-muted-foreground">Behind</p>
              <p className="mt-1 text-lg font-semibold text-red-400">
                {analytics.behind}
              </p>
            </div>
            <div className="border border-border p-3">
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="mt-1 text-lg font-semibold text-emerald-500">
                {analytics.completed}
              </p>
            </div>
          </div>

          {/* Objective cards */}
          <div className="space-y-4">
            {objectives.map((obj) => (
              <ObjectiveCard
                key={obj.id}
                objective={obj}
                krRenderer={(kr) => (
                  <CheckInKrRow
                    kr={kr as any}
                    cycleId={cycleId}
                    locked={locked}
                  />
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
