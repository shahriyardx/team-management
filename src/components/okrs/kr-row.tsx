"use client"

import { useCallback, useState } from "react"
import { format } from "date-fns"
import {
  CaretDown,
  CaretRight,
  PencilSimple,
  Trash,
} from "@phosphor-icons/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProgressBar } from "@/components/okrs/progress-bar"
import { KrFormDialog, type KrForm } from "@/components/okrs/kr-form-dialog"
import { api } from "@/lib/trpc/client"
import { useOrganization } from "@/lib/organization-context"

export type KrRowItem = {
  id: string
  title: string
  description: string | null
  progress: number
  currentValue: number
  targetValue: number
  maxValue: number | null
  unit: string
  weight: number
  status: string
  ownerId: string
}

interface KrRowProps {
  kr: KrRowItem
  readOnly?: boolean
}

const statusCardStyle: Record<string, string> = {
  not_started: "border-l-muted-foreground/20",
  on_track: "border-l-sky-500/30 bg-sky-500/[0.03]",
  at_risk: "border-l-amber-500/30 bg-amber-500/[0.03]",
  behind: "border-l-red-500/30 bg-red-500/[0.03]",
  achieved: "border-l-emerald-500/30 bg-emerald-500/[0.03]",
  completed: "border-l-emerald-500/30 bg-emerald-500/[0.03]",
}

export function KrRow({ kr, readOnly }: KrRowProps) {
  const { organization } = useOrganization()
  const utils = api.useUtils()
  const [expanded, setExpanded] = useState(false)
  const toggle = useCallback(() => setExpanded((p) => !p), [])

  // Check-in history for expanded view
  const { data: checkInsData } = api.checkIn.list.useQuery(
    {
      keyResultId: kr.id,
      organizationId: organization?.id ?? "",
      skip: 0,
      take: 20,
    },
    { enabled: expanded && !!organization },
  )
  const checkIns = (checkInsData?.checkIns ?? []) as Array<{
    id: string
    previousValue: number
    newValue: number
    note: string | null
    createdAt: string
    author: {
      user: { id: string; name: string; email: string; image?: string | null }
    }
  }>

  // Edit
  const [editOpen, setEditOpen] = useState(false)
  const updateMutation = api.keyResult.update.useMutation({
    onSuccess: () => {
      utils.objective.listOrgLevel.invalidate()
      utils.objective.listTeamLevel.invalidate()
      utils.objective.listMemberLevel.invalidate()
      setEditOpen(false)
    },
  })

  const handleEdit = (data: KrForm) => {
    updateMutation.mutate({
      ...data,
      description: data.description ?? null,
      id: kr.id,
    })
  }

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deleteMutation = api.keyResult.delete.useMutation({
    onSuccess: () => {
      utils.objective.listOrgLevel.invalidate()
      utils.objective.listTeamLevel.invalidate()
      utils.objective.listMemberLevel.invalidate()
      setDeleteOpen(false)
    },
  })

  return (
    <>
      <div className={"border border-muted-foreground/20 border-l-2 px-3 py-2 " + (statusCardStyle[kr.status] ?? "border-l-muted-foreground/20")}>
        <div className="flex flex-col gap-2 items-start sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={toggle}
                className="flex items-start gap-1 cursor-pointer"
              >
                {expanded ? (
                  <CaretDown className="size-3 text-muted-foreground hidden sm:inline" />
                ) : (
                  <CaretRight className="size-3 text-muted-foreground hidden sm:inline" />
                )}
                <span className="text-xs font-medium wrap-break-words text-left">
                  {kr.title}
                </span>
              </button>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex-1 sm:max-w-xs">
                <ProgressBar value={kr.progress} size="sm" status={kr.status} />
              </div>
              <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground shrink-0">
                {kr.progress}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!readOnly && (
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setEditOpen(true)}
              >
                <PencilSimple className="size-3.5" />
              </Button>
            )}
            {!readOnly && (
              <Button
                variant="destructive"
                size="icon-sm"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
        {expanded && (
          <div className="mt-2 border-t border-border pt-2 space-y-2">
            {kr.description && (
              <p className="text-xs text-muted-foreground">{kr.description}</p>
            )}
            {checkInsData && checkIns.length > 0 && (
              <div className="space-y-1.5">
                {checkIns.map((ci) => (
                  <div
                    key={ci.id}
                    className="flex items-start gap-2 text-[11px]"
                  >
                    <Badge
                      variant="outline"
                      className="shrink-0 text-[10px] whitespace-nowrap"
                    >
                      {ci.previousValue} → {ci.newValue}
                    </Badge>
                    <div className="min-w-0 leading-tight">
                      {ci.note && (
                        <span className="text-muted-foreground">{ci.note}</span>
                      )}
                      <span className="text-muted-foreground/50">
                        {" "}
                        – {ci.author.user.name}
                      </span>
                      <span className="text-muted-foreground/30 ml-1">
                        {format(new Date(ci.createdAt), "MMM d")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {checkInsData && checkIns.length === 0 && !kr.description && (
              <p className="text-[11px] text-muted-foreground/50">
                No check-ins yet.
              </p>
            )}
          </div>
        )}
      </div>

      <KrFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        defaultValues={{
          title: kr.title,
          description: kr.description ?? "",
          targetValue: kr.targetValue,
          maxValue: kr.maxValue,
          currentValue: kr.currentValue,
          unit: kr.unit,
          weight: kr.weight,
        }}
        onSubmit={handleEdit}
        isPending={updateMutation.isPending}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete key result?</DialogTitle>
            <DialogDescription>
              This will also delete all check-ins for this key result. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate({ id: kr.id })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
