"use client"

import { Fragment, useMemo } from "react"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Plus } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { KanbanCard } from "./kanban-card"
import type { Task } from "./types"

interface Props {
  status: string
  label: string
  tasks: Task[]
  color: string
  onCardClick?: (taskId: string) => void
  onAddClick?: () => void
  dragOverId?: string | null
  activeTask?: Task | null
}

function DropIndicator() {
  return (
    <div className="relative h-1">
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-full bg-primary" />
    </div>
  )
}

export function KanbanColumn({
  status,
  label,
  tasks,
  color,
  onCardClick,
  onAddClick,
  dragOverId,
  activeTask,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  const isDragOverThisColumn = Boolean(
    dragOverId &&
      (dragOverId === status || tasks.some((t) => t.id === dragOverId)),
  )

  const isCrossColumn = Boolean(activeTask && activeTask.status !== status)

  const dropIndex = useMemo(() => {
    if (!isDragOverThisColumn || !isCrossColumn) return -1
    if (dragOverId === status) return tasks.length
    return tasks.findIndex((t) => t.id === dragOverId)
  }, [isDragOverThisColumn, isCrossColumn, dragOverId, tasks, status])

  return (
    <div className="flex flex-1 flex-col min-w-[280px]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-semibold">{label}</span>
          <span className="text-[10px] text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        {onAddClick && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onAddClick}
            className="size-6"
          >
            <Plus className="size-3" />
          </Button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 rounded-none border border-dashed p-2 min-h-[200px] transition-colors ${
          isOver
            ? "border-foreground/40 bg-accent/50"
            : "border-border bg-muted/30"
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="flex flex-1 items-center justify-center min-h-[60px]">
              {dropIndex === 0 ? (
                <DropIndicator />
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  No tasks
                </span>
              )}
            </div>
          ) : (
            tasks.map((task, i) => (
              <Fragment key={task.id}>
                {dropIndex === i && <DropIndicator />}
                <KanbanCard
                  task={task}
                  onClick={() => onCardClick?.(task.id)}
                />
              </Fragment>
            ))
          )}
          {tasks.length > 0 && dropIndex >= tasks.length && (
            <DropIndicator />
          )}
        </SortableContext>
      </div>
    </div>
  )
}
