"use client"

import { useState } from "react"
import { type ReactNode } from "react"
import { CaretDown, CaretRight, PencilSimple, Trash } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { ProgressBar } from "@/components/okrs/progress-bar"
import { EditObjectiveDialog } from "@/components/okrs/edit-objective-dialog"
import { StatusBadge } from "@/components/okrs/status-badge"

export type KrItem = {
  id: string
  title: string
  currentValue: number
  targetValue: number
  unit: string
}

export type ObjectiveItem = {
  id: string
  title: string
  status: string
  progress: number
  keyResults: KrItem[]
}

interface ObjectiveCardProps {
  objective: ObjectiveItem
  onAddKr?: (id: string) => void
  onEdit?: (id: string, title: string) => void
  onDelete?: (id: string) => void
  krRenderer?: (kr: KrItem) => ReactNode
}

export function ObjectiveCard({
  objective,
  onAddKr,
  onEdit,
  onDelete,
  krRenderer,
}: ObjectiveCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [open, setOpen] = useState(true)

  return (
    <div className="border border-border p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen((p) => !p)}
            className="flex items-center gap-1 cursor-pointer"
          >
            {open
              ? <CaretDown className="size-3 text-muted-foreground" />
              : <CaretRight className="size-3 text-muted-foreground" />}
            <span className="text-xs font-medium">{objective.title}</span>
          </button>
          <StatusBadge status={objective.status} />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <div className="sm:w-64">
            <ProgressBar value={objective.progress} size="sm" status={objective.status} showLabel />
          </div>
          <div className="flex shrink-0 flex-wrap gap-1">
            {onEdit && (
              <Button variant="ghost" size="icon-xs" onClick={() => setEditOpen(true)}>
                <PencilSimple className="size-3" />
              </Button>
            )}
            {onAddKr && (
              <Button variant="outline" size="xs" onClick={() => onAddKr(objective.id)}>
                + KR
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon-xs" onClick={() => onDelete(objective.id)}>
                <Trash className="size-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
      {open && objective.keyResults.length > 0 && !krRenderer && (
        <div className="mt-2 space-y-1 pl-2 border-l-2 border-border">
          {objective.keyResults.map((kr) => (
            <div key={kr.id} className="flex items-center gap-3">
              <span className="text-[11px] text-muted-foreground truncate">{kr.title}</span>
              <span className="text-[10px] text-muted-foreground/60 shrink-0">
                {kr.currentValue}/{kr.targetValue} {kr.unit}
              </span>
            </div>
          ))}
        </div>
      )}
      {open && krRenderer && objective.keyResults.length > 0 && (
        <div className="mt-2 space-y-1">
          {objective.keyResults.map((kr) => krRenderer(kr))}
        </div>
      )}
      {onEdit && (
        <EditObjectiveDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          defaultTitle={objective.title}
          onSubmit={(data) => {
            onEdit(objective.id, data.title)
            setEditOpen(false)
          }}
          isPending={false}
        />
      )}
    </div>
  )
}
