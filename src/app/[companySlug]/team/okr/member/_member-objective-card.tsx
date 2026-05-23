"use client"

import { Badge } from "@/components/ui/badge"
import { ProgressBar } from "@/components/okrs/progress-bar"
import { CheckInKrRow } from "@/components/okrs/check-in-kr-row"

const statusBadge: Record<string, string> = {
  not_started: "outline",
  on_track: "default",
  at_risk: "secondary",
  behind: "destructive",
  achieved: "default",
  completed: "default",
}

interface MemberObjectiveCardProps {
  cycleId: string
  locked?: boolean
  objective: {
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
      status: string
      ownerId: string
    }>
  }
}

export function MemberObjectiveCard({ cycleId, locked, objective }: MemberObjectiveCardProps) {
  return (
    <div className="border border-border p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{objective.title}</span>
          <Badge variant={statusBadge[objective.status] as "default" | "secondary" | "destructive" | "outline"}>
            {objective.status.replace(/_/g, " ")}
          </Badge>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {Math.round(objective.progress)}%
        </span>
      </div>
      {objective.description && (
        <p className="mt-1 text-xs text-muted-foreground">{objective.description}</p>
      )}
      <div className="mt-2">
        <ProgressBar value={objective.progress} size="sm" status={objective.status} />
      </div>
      <div className="mt-3 space-y-2">
        {objective.keyResults.map((kr) => (
          <CheckInKrRow key={kr.id} kr={kr} cycleId={cycleId} locked={locked} />
        ))}
      </div>
    </div>
  )
}
