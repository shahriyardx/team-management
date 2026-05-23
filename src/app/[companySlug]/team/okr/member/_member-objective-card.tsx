"use client"

import { ProgressBar } from "@/components/okrs/progress-bar"
import { CheckInKrRow } from "@/components/okrs/check-in-kr-row"
import { StatusBadge } from "@/components/okrs/status-badge"

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
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{objective.title}</span>
        <StatusBadge status={objective.status} />
      </div>
      {objective.description && (
        <p className="mt-1 text-xs text-muted-foreground">{objective.description}</p>
      )}
      <div className="mt-2 flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar value={objective.progress} size="sm" status={objective.status} />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground shrink-0">
          {Math.round(objective.progress)}%
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {objective.keyResults.map((kr) => (
          <CheckInKrRow key={kr.id} kr={kr} cycleId={cycleId} locked={locked} />
        ))}
      </div>
    </div>
  )
}
