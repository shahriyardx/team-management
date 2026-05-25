"use client"

import { createContext, useContext, type ReactNode } from "react"
import { DotsSixVertical } from "@phosphor-icons/react"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useDroppable, useDndContext } from "@dnd-kit/core"

const DragSourceObjectiveContext = createContext<string | null>(null)

export function useDragSourceObjectiveId() {
  return useContext(DragSourceObjectiveContext)
}

export function DragSourceObjectiveProvider({
  value,
  children,
}: {
  value: string | null
  children: ReactNode
}) {
  return (
    <DragSourceObjectiveContext.Provider value={value}>
      {children}
    </DragSourceObjectiveContext.Provider>
  )
}

interface SortableKRItemProps {
  id: string
  objectiveId: string
  children: ReactNode
}

function SortableKRItem({ id, objectiveId, children }: SortableKRItemProps) {
  const dndContext = useDndContext()
  const activeId = dndContext?.active?.id ?? null
  const dragSourceObjectiveId = useDragSourceObjectiveId()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id })
  const isTarget =
    isOver &&
    activeId !== null &&
    activeId !== id &&
    dragSourceObjectiveId !== null &&
    dragSourceObjectiveId !== objectiveId

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group transition-colors ${isTarget ? "border-t-2 border-muted-foreground bg-accent/10" : ""}`}
    >
      <div
        className="absolute -left-0.5 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <DotsSixVertical className="size-3.5" />
      </div>
      {children}
    </div>
  )
}

interface SortableKRContainerProps {
  krIds: string[]
  objectiveId: string
  renderItem: (id: string) => ReactNode
}

export function SortableKRContainer({
  krIds,
  objectiveId,
  renderItem,
}: SortableKRContainerProps) {
  const dragSourceObjectiveId = useDragSourceObjectiveId()
  const isCrossDrag =
    dragSourceObjectiveId !== null && dragSourceObjectiveId !== objectiveId
  const { setNodeRef: endRef, isOver: endOver } = useDroppable({
    id: `end-${objectiveId}`,
  })
  const showEnd = endOver && isCrossDrag

  return (
    <SortableContext items={krIds} strategy={verticalListSortingStrategy}>
      <div className="space-y-1">
        {krIds.map((id) => (
          <SortableKRItem key={id} id={id} objectiveId={objectiveId}>
            {renderItem(id)}
          </SortableKRItem>
        ))}
        <div
          ref={endRef}
          className={`h-4 transition-colors ${showEnd ? "border-t-2 border-muted-foreground" : ""}`}
        />
      </div>
    </SortableContext>
  )
}

export function DropZone({
  objectiveId,
  isEmpty,
}: {
  objectiveId: string
  isEmpty?: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `drop-${objectiveId}` })
  const dragSourceObjectiveId = useDragSourceObjectiveId()
  const isCrossObjective =
    dragSourceObjectiveId !== null && dragSourceObjectiveId !== objectiveId

  return (
    <div
      ref={setNodeRef}
      className={`transition-colors flex items-center justify-center text-xs ${
        isEmpty
          ? `min-h-[60px] border-2 border-dashed mt-2 ${isOver ? "border-foreground bg-accent/30" : "border-border"}`
          : `min-h-[6px] ${isOver && isCrossObjective ? "bg-accent/30 border-2 border-dashed border-foreground" : ""}`
      }`}
    >
      {isEmpty && isOver && (
        <span className="text-muted-foreground">Drop KR here</span>
      )}
      {isEmpty && !isOver && (
        <span className="text-muted-foreground">No key results</span>
      )}
    </div>
  )
}
