"use client"

import { useMemo, useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { KanbanColumn } from "./kanban-column"
import { KanbanCard } from "./kanban-card"
import { statusOrder, statusLabels, type Task } from "./types"

const columnColors: Record<string, string> = {
  todo: "#6366f1",
  in_progress: "#f59e0b",
  done: "#22c55e",
}

interface Props {
  tasks: Task[]
  onStatusChange: (taskId: string, newStatus: string, sortOrder?: number) => void
  onReorder: (items: Array<{ id: string; sortOrder: number }>) => void
  onCardClick?: (taskId: string) => void
  onAddClick?: (status: string) => void
}

export function KanbanBoard({
  tasks,
  onStatusChange,
  onReorder,
  onCardClick,
  onAddClick,
}: Props) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const columns = useMemo(
    () =>
      statusOrder.map((status) => ({
        status,
        label: statusLabels[status] ?? status,
        tasks: tasks.filter((t) => t.status === status),
        color: columnColors[status] ?? "#6b7280",
      })),
    [tasks],
  )

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  function handleDragOver(event: DragOverEvent) {
    setDragOverId((event.over?.id as string) ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    setDragOverId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const taskId = active.id as string
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const overId = over.id as string
    const isStatusDrop = (statusOrder as readonly string[]).includes(overId)
    const overTask = isStatusDrop ? null : tasks.find((t) => t.id === overId)
    const newStatus = overTask?.status ?? (isStatusDrop ? overId : null)
    if (!newStatus || !(statusOrder as readonly string[]).includes(newStatus)) return

    if (task.status === newStatus) {
      // Same column — reorder
      const columnTasks = tasks.filter((t) => t.status === task.status)
      const oldIdx = columnTasks.findIndex((t) => t.id === taskId)
      let newIdx: number

      if (overTask) {
        newIdx = columnTasks.findIndex((t) => t.id === overId)
      } else {
        newIdx = columnTasks.length - 1
      }

      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return

      const reordered = arrayMove(columnTasks, oldIdx, newIdx)
      const items = reordered.map((t, i) => ({ id: t.id, sortOrder: i }))
      onReorder(items)
    } else {
      // Cross-column — change status with position
      const targetTasks = tasks.filter((t) => t.status === newStatus && t.id !== taskId)
      let sortOrder: number

      if (overTask) {
        const overIdx = targetTasks.findIndex((t) => t.id === overId)
        sortOrder = overIdx >= 0 ? overIdx : targetTasks.length
      } else {
        sortOrder = targetTasks.length
      }

      // Reindex target column so sortOrders are sequential
      targetTasks.splice(sortOrder, 0, task)
      const items = targetTasks.map((t, i) => ({ id: t.id, sortOrder: i }))
      onReorder(items)
      onStatusChange(taskId, newStatus, sortOrder)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-1 gap-4 overflow-auto">
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            label={col.label}
            tasks={col.tasks}
            color={col.color}
            onCardClick={onCardClick}
            onAddClick={
              onAddClick ? () => onAddClick(col.status) : undefined
            }
            dragOverId={dragOverId}
            activeTask={activeTask}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="rotate-3 opacity-90">
            <KanbanCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
