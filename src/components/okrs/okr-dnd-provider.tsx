"use client"

import { useCallback, useMemo, useState, type ReactNode } from "react"
import { flushSync } from "react-dom"
import { useQueryClient } from "@tanstack/react-query"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { api } from "@/lib/trpc/client"
import { DragSourceObjectiveProvider } from "@/components/okrs/sortable-kr-list"
import { DotsSixVertical } from "@phosphor-icons/react"

export interface ObjectiveData {
  id: string
  krIds: string[]
  krTitles?: Record<string, string>
}

interface OkrDndProviderProps {
  children: ReactNode
  objectives: ObjectiveData[]
  organizationId: string
}

export function OkrDndProvider({
  children,
  objectives,
  organizationId,
}: OkrDndProviderProps) {
  const utils = api.useUtils()
  const queryClient = useQueryClient()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragSourceObjectiveId, setDragSourceObjectiveId] = useState<string | null>(null)

  const reorderMutation = api.keyResult.reorder.useMutation({
    onSettled: () => {
      utils.objective.list.invalidate()
    },
  })

  const moveMutation = api.keyResult.move.useMutation({
    onSettled: () => {
      utils.objective.list.invalidate()
    },
  })

  const krTitlesMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const obj of objectives) {
      if (obj.krTitles) {
        Object.assign(map, obj.krTitles)
      }
    }
    return map
  }, [objectives])

  const krObjectiveMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const obj of objectives) {
      for (const krId of obj.krIds) {
        map[krId] = obj.id
      }
    }
    return map
  }, [objectives])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    setDragSourceObjectiveId(krObjectiveMap[event.active.id as string] ?? null)
  }, [krObjectiveMap])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null)
      setDragSourceObjectiveId(null)
      const { active, over } = event
      if (!over || active.id === over.id) return

      const krId = active.id as string
      const targetId = over.id as string
      const srcObjId = krObjectiveMap[krId]

      // ── Drop onto objective drop zone (empty) or end-of-list target ──
      if (targetId.startsWith("drop-") || targetId.startsWith("end-")) {
        const prefix = targetId.startsWith("drop-") ? "drop-" : "end-"
        const dstObjId = targetId.slice(prefix.length)
        if (!srcObjId || !dstObjId || srcObjId === dstObjId) return
        const dstObj = objectives.find((o) => o.id === dstObjId)
        const targetIdx = dstObj ? dstObj.krIds.length : 0

        // Optimistic cache update (flushSync prevents @dnd-kit snap-back)
        flushSync(() => {
          queryClient.setQueriesData(
            { queryKey: [["objective", "list"]] },
            (oldData: any) => {
              if (!oldData?.objectives) return oldData
              return {
                ...oldData,
                objectives: moveKrInCache(oldData.objectives, krId, srcObjId, dstObjId, targetIdx),
              }
            },
          )
        })

        moveMutation.mutate({
          krId,
          targetObjectiveId: dstObjId,
          sortOrder: targetIdx,
          organizationId,
        })
        return
      }

      const dstObjId = krObjectiveMap[targetId]
      if (!srcObjId || !dstObjId) return

      if (srcObjId === dstObjId) {
        // ── Reorder within same objective ──
        const obj = objectives.find((o) => o.id === srcObjId)
        if (!obj) return
        const oldIdx = obj.krIds.indexOf(krId)
        const newIdx = obj.krIds.indexOf(targetId)
        const reorderedIds = arrayMove(obj.krIds, oldIdx, newIdx)

        // Optimistic cache update (flushSync prevents @dnd-kit snap-back)
        flushSync(() => {
          queryClient.setQueriesData(
            { queryKey: [["objective", "list"]] },
            (oldData: any) => {
              if (!oldData?.objectives) return oldData
              return {
                ...oldData,
                objectives: oldData.objectives.map((o: any) => {
                  if (o.id !== srcObjId) return o
                  return {
                    ...o,
                    keyResults: arrayMove(o.keyResults, oldIdx, newIdx),
                  }
                }),
              }
            },
          )
        })

        reorderMutation.mutate({
          items: reorderedIds.map((id, idx) => ({ id, sortOrder: idx })),
          organizationId,
        })
      } else {
        // ── Move to different objective ──
        const dstObj = objectives.find((o) => o.id === dstObjId)
        const targetIdx = dstObj ? dstObj.krIds.indexOf(targetId) : 0

        // Optimistic cache update (flushSync prevents @dnd-kit snap-back)
        flushSync(() => {
          queryClient.setQueriesData(
            { queryKey: [["objective", "list"]] },
            (oldData: any) => {
              if (!oldData?.objectives) return oldData
              return {
                ...oldData,
                objectives: moveKrInCache(oldData.objectives, krId, srcObjId, dstObjId, targetIdx),
              }
            },
          )
        })

        moveMutation.mutate({
          krId,
          targetObjectiveId: dstObjId,
          sortOrder: targetIdx,
          organizationId,
        })
      }
    },
    [krObjectiveMap, objectives, reorderMutation, moveMutation, organizationId, queryClient],
  )

  const activeKrTitle = activeId ? krTitlesMap[activeId] : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <DragSourceObjectiveProvider value={dragSourceObjectiveId}>
        {children}
      </DragSourceObjectiveProvider>
      <DragOverlay dropAnimation={null}>
        {activeId && (
          <div className="border border-border bg-background px-4 py-3 shadow-xl rounded-none w-72">
            <div className="flex items-center gap-2">
              <DotsSixVertical className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs font-medium truncate">
                {activeKrTitle ?? "Moving..."}
              </span>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

/** Move a KR from one objective to another in the objectives array for cache update */
function moveKrInCache(
  objectives: any[],
  krId: string,
  srcObjId: string,
  dstObjId: string,
  targetIdx: number,
) {
  let krToMove: any = null

  // Remove from source
  let result = objectives.map((obj: any) => {
    if (obj.id !== srcObjId) return obj
    const filtered = obj.keyResults.filter((kr: any) => kr.id !== krId)
    if (filtered.length !== obj.keyResults.length) {
      krToMove = obj.keyResults.find((kr: any) => kr.id === krId)
    }
    return { ...obj, keyResults: filtered }
  })

  if (!krToMove) return result

  // Insert into target at index
  result = result.map((obj: any) => {
    if (obj.id !== dstObjId) return obj
    const newKrs = [...obj.keyResults]
    newKrs.splice(targetIdx, 0, { ...krToMove, objectiveId: dstObjId })
    return { ...obj, keyResults: newKrs }
  })

  return result
}
