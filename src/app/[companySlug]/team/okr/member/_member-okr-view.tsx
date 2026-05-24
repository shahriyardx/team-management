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
import { MemberObjectiveCard } from "./_member-objective-card"

interface MemberOkrViewProps {
  cycleId?: string
  locked?: boolean
}

type OkrCycleItem = {
  id: string
  title: string
  status: string
  locked?: boolean
  startDate: string
  endDate: string
}

export function MemberOkrView({ cycleId: initialCycleId, locked: initialLocked }: MemberOkrViewProps) {
  const { organization } = useOrganization()

  const { data: cyclesData } = api.okrCycle.listActive.useQuery(
    { organizationId: organization?.id ?? "", skip: 0, take: 25 },
    { enabled: !!organization },
  )
  const cycles = (cyclesData?.cycles ?? []) as OkrCycleItem[]
  const years = cyclesData?.years ?? [String(new Date().getFullYear())]

  const [selectedCycleId, setSelectedCycleId] = useState<string>(initialCycleId ?? "")
  const [selectedYear, setSelectedYear] = useState<string>(
    String(new Date().getFullYear()),
  )

  const filteredCycles = useMemo(
    () => cycles.filter((c) => c.startDate?.startsWith(selectedYear)),
    [cycles, selectedYear],
  )

  // Auto-select cycle whose date range includes today, else first active cycle
  useEffect(() => {
    if (!selectedCycleId && filteredCycles.length > 0) {
      const now = new Date()
      const current = filteredCycles.find((c) => {
        const s = new Date(c.startDate)
        const e = new Date(c.endDate)
        return s <= now && now <= e
      })
      if (current) { setSelectedCycleId(current.id); return }
      setSelectedCycleId(filteredCycles[0].id)
    }
  }, [filteredCycles, selectedCycleId])

  const cycleId = selectedCycleId || initialCycleId || ""
  const selectedCycle = cycles.find((c) => c.id === cycleId)
  const locked = selectedCycle?.locked ?? initialLocked ?? false

  const { data: objectivesData, isLoading } = api.objective.list.useQuery(
    { cycleId, organizationId: organization?.id ?? "", scope: "member" },
    { enabled: !!cycleId && !!organization },
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
          <h1 className="text-lg font-semibold text-foreground">My OKRs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Your personal objectives and key results.</p>
          <p className="text-xs text-muted-foreground sm:hidden">
            {cycles.find((c) => c.id === cycleId)?.title ?? ""}
          </p>
        </div>
        <div className="hidden sm:flex flex-wrap items-center gap-3 shrink-0">
          <Select value={selectedYear} onValueChange={(v) => { setSelectedYear(v); setSelectedCycleId("") }}>
            <SelectTrigger className="h-7 w-auto min-w-20 rounded-none text-xs">
              {selectedYear}
            </SelectTrigger>
            <SelectContent position="popper">
              {years.map((yr) => (
                <SelectItem key={yr} value={yr}>{yr}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={cycleId} onValueChange={setSelectedCycleId}>
            <SelectTrigger className="h-7 w-auto min-w-32 rounded-none text-xs">
              <span className="truncate">
                {cycles.find((c) => c.id === cycleId)?.title ?? "Select cycle"}
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
          No active cycles in {selectedYear}.
        </div>
      ) : objectives.length === 0 ? (
        <div className="border border-border p-8 text-center text-xs text-muted-foreground">
          No objectives assigned to you yet.
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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

          <div className="space-y-4">
            {objectives.map((obj) => (
              <MemberObjectiveCard key={obj.id} cycleId={cycleId} locked={locked} objective={obj} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
