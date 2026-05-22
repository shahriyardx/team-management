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
import { Badge } from "@/components/ui/badge"
import { MemberObjectiveCard } from "./_member-objective-card"

interface MemberOkrViewProps {
  cycleId: string
  locked?: boolean
}

type OkrCycleItem = {
  id: string
  title: string
  status: string
  locked?: boolean
  startDate: string
}

export function MemberOkrView({ cycleId: initialCycleId, locked: initialLocked }: MemberOkrViewProps) {
  const { session, organization } = useOrganization()

  // Fetch cycles for selector
  const { data: cyclesData } = api.okrCycle.list.useQuery(
    { organizationId: organization?.id ?? "", skip: 0, take: 25 },
    { enabled: !!organization },
  )
  const cycles = (cyclesData?.cycles ?? []) as OkrCycleItem[]
  const activeCycle = cycles.find((c) => c.status === "active")

  const [selectedCycleId, setSelectedCycleId] = useState<string>(initialCycleId)
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()))

  // Years 2020 to current + 1
  const years = useMemo(() => {
    const cur = new Date().getFullYear()
    return Array.from({ length: cur - 2020 + 2 }, (_, i) => String(2020 + i)).reverse()
  }, [])

  // Auto-select cycle when cycles load
  useEffect(() => {
    if (!selectedCycleId && cycles.length > 0) {
      setSelectedCycleId(cycles[0].id)
    }
  }, [cycles, selectedCycleId])

  const cycleId = selectedCycleId || initialCycleId
  const selectedCycle = cycles.find((c) => c.id === cycleId)
  const locked = selectedCycle?.locked ?? initialLocked

  const { data: objectivesData, isLoading } = api.objective.list.useQuery(
    { cycleId, organizationId: organization?.id ?? "" },
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

  if (!cycleId) {
    return (
      <div className="border border-border p-8 text-center text-xs text-muted-foreground">
        No OKR cycles available.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">My OKRs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Your personal objectives and key results.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Select value={selectedYear} onValueChange={(v) => { setSelectedYear(v); setSelectedCycleId("") }}>
            <SelectTrigger className="h-7 w-auto min-w-20 rounded-none text-xs">
              {selectedYear === "all" ? "All years" : selectedYear}
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all">All years</SelectItem>
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
              {(selectedYear === "all" ? cycles : cycles.filter((c) => c.startDate?.startsWith(selectedYear))).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center gap-2">
                    <span>{c.title}</span>
                    <Badge variant="outline" className="text-[10px]">{c.status}</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
