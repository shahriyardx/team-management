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

export function MemberObjectiveCard({
  cycleId,
  locked,
  objective,
}: MemberObjectiveCardProps) {
  return (
    <div className="border border-border p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium">{objective.title}</span>
          <StatusBadge status={objective.status} />
        </div>
        <div className="sm:w-64 shrink-0">
          <ProgressBar
            value={objective.progress}
            size="sm"
            status={objective.status}
            showLabel
          />
        </div>
      </div>
      {objective.description && (
        <p className="mt-1 text-xs text-muted-foreground">
          {objective.description}
        </p>
      )}
      <div className="mt-3 space-y-1">
        {objective.keyResults.map((kr) => (
          <CheckInKrRow key={kr.id} kr={kr} cycleId={cycleId} locked={locked} />
        ))}
      </div>
    </div>
  )
}
