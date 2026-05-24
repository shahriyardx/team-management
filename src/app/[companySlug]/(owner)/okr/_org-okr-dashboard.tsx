"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, PencilSimple, Plus } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"
import { CheckInKrRow } from "@/components/okrs/check-in-kr-row"
import { KrFormDialog, type KrForm } from "@/components/okrs/kr-form-dialog"
import { ObjectiveCardWithKRs } from "@/components/okrs/objective-card-with-krs"
import { OkrDndProvider } from "@/components/okrs/okr-dnd-provider"

const objectiveSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().optional(),
})

type ObjectiveForm = z.infer<typeof objectiveSchema>

type OkrObjective = {
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
    weight: number
    status: string
    ownerId: string | null
  }>
}

type OkrCycleItem = {
  id: string
  title: string
  status: string
  description: string | null
  cycleType: string
  startDate: string
  endDate: string
  _count: { objectives: number }
}

export function OrgOkrDashboard() {
  const { organization } = useOrganization()
  const utils = api.useUtils()

  // Cycles
  const { data: cyclesData } = api.okrCycle.list.useQuery(
    { organizationId: organization?.id ?? "", skip: 0, take: 25 },
    { enabled: !!organization },
  )
  const cycles = (cyclesData?.cycles ?? []) as OkrCycleItem[]
  const years = cyclesData?.years ?? [String(new Date().getFullYear())]
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>(
    String(new Date().getFullYear()),
  )
  const [isEditMode, setIsEditMode] = useState(false)

  const filteredCycles = useMemo(
    () => cycles.filter((c) => c.startDate?.startsWith(selectedYear)),
    [cycles, selectedYear],
  )

  // Auto-select cycle whose date range includes today, else first cycle
  useEffect(() => {
    if (!selectedCycleId && filteredCycles.length > 0) {
      const now = new Date()
      const current = filteredCycles.find((c) => {
        const s = new Date(c.startDate)
        const e = new Date(c.endDate)
        return s <= now && now <= e
      })
      if (current) { setSelectedCycleId(current.id); return }
      setSelectedCycleId(filteredCycles[0].id)
    }
  }, [filteredCycles, selectedCycleId])

  // Objectives — org-level only (scope: "org")
  const { data: objectivesData, isLoading: objectivesLoading } =
    api.objective.list.useQuery(
      {
        cycleId: selectedCycleId ?? "",
        organizationId: organization?.id ?? "",
        scope: "org",
      },
      { enabled: !!selectedCycleId && !!organization },
    )
  const objectives = (objectivesData?.objectives ?? []) as OkrObjective[]

  // Create objective
  const [objFormOpen, setObjFormOpen] = useState(false)
  const objectiveForm = useForm<ObjectiveForm>({
    resolver: zodResolver(objectiveSchema) as any,
    defaultValues: { title: "", description: "" },
  })

  const createObjectiveMutation = api.objective.create.useMutation({
    onSuccess: () => {
      utils.objective.list.invalidate({
        cycleId: selectedCycleId ?? "",
        scope: "org",
      })
      setObjFormOpen(false)
      objectiveForm.reset()
    },
  })

  // Create KR
  const [krFormOpen, setKrFormOpen] = useState(false)
  const [krObjectiveId, setKrObjectiveId] = useState("")

  const createKrMutation = api.keyResult.create.useMutation({
    onSuccess: () => {
      utils.objective.list.invalidate({
        cycleId: selectedCycleId ?? "",
        scope: "org",
      })
      setKrFormOpen(false)
    },
  })

  const openKrForm = useCallback((objectiveId: string) => {
    setKrObjectiveId(objectiveId)
    setKrFormOpen(true)
  }, [])

  // Delete objective
  const [deleteObj, setDeleteObj] = useState<string | null>(null)
  const deleteObjectiveMutation = api.objective.delete.useMutation({
    onSuccess: () => {
      utils.objective.list.invalidate({
        cycleId: selectedCycleId ?? "",
        scope: "org",
      })
      setDeleteObj(null)
    },
  })

  // Update objective
  const updateObjectiveMutation = api.objective.update.useMutation({
    onSuccess: () => {
      utils.objective.list.invalidate({
        cycleId: selectedCycleId ?? "",
        scope: "org",
      })
    },
  })

  // Analytics summary
  const analytics = useMemo(() => {
    if (objectives.length === 0) {
      return { avgProgress: 0, onTrack: 0, atRisk: 0, behind: 0, completed: 0 }
    }
    const totalProgress = objectives.reduce((s, o) => s + o.progress, 0)
    const statusFilter = (status: string) =>
      objectives.filter((o) => o.status === status).length
    return {
      avgProgress: Math.round(totalProgress / objectives.length),
      onTrack: statusFilter("on_track"),
      atRisk: statusFilter("at_risk"),
      behind: statusFilter("behind"),
      completed: statusFilter("completed"),
    }
  }, [objectives])

  const handleCreateObjective = objectiveForm.handleSubmit((data) => {
    if (!organization || !selectedCycleId) return
    createObjectiveMutation.mutate({
      title: data.title,
      description: data.description || null,
      cycleId: selectedCycleId,
      organizationId: organization.id,
    })
  })

  const handleCreateKr = (data: KrForm) => {
    if (!organization) return
    createKrMutation.mutate({
      ...data,
      description: data.description || null,
      objectiveId: krObjectiveId,
      organizationId: organization.id,
    })
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold">Org OKRs</h1>
          <p className="text-xs text-muted-foreground sm:hidden">
            {cycles.find((c) => c.id === selectedCycleId)?.title ?? ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <Select
              value={selectedYear}
              onValueChange={(v) => {
                setSelectedYear(v)
                setSelectedCycleId(null)
              }}
            >
              <SelectTrigger className="h-8 w-auto min-w-20 rounded-none text-xs">
                {selectedYear}
              </SelectTrigger>
              <SelectContent position="popper">
                {years.map((yr) => (
                  <SelectItem key={yr} value={yr}>
                    {yr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedCycleId ?? ""}
              onValueChange={setSelectedCycleId}
            >
              <SelectTrigger className="h-8 w-auto min-w-32 rounded-none text-xs">
                <span className="truncate">
                  {cycles.find((c) => c.id === selectedCycleId)?.title ??
                    "Select cycle"}
                </span>
              </SelectTrigger>
              <SelectContent position="popper">
                {filteredCycles.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span>{c.title}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant={isEditMode ? "default" : "outline"}
            onClick={() => setIsEditMode((p) => !p)}
            className="shrink-0"
          >
            {isEditMode ? (
              <Eye className="mr-1 size-3.5" />
            ) : (
              <PencilSimple className="mr-1 size-3.5" />
            )}
            {isEditMode ? "View" : "Edit"}
          </Button>
          {isEditMode && (
            <Button
              onClick={() => {
                objectiveForm.reset()
                setObjFormOpen(true)
              }}
              disabled={!selectedCycleId}
              className="shrink-0"
            >
              <Plus className="mr-1 size-3.5" />
              New Objective
            </Button>
          )}
        </div>
      </div>
      {/* Loading */}
      {objectivesLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : !selectedCycleId ? (
        <div className="border border-border p-8 text-center text-xs text-muted-foreground">
          {cycles.length === 0
            ? "No cycles yet."
            : `No cycles in ${selectedYear}.`}
        </div>
      ) : objectives.length === 0 ? (
        <div className="border border-border p-8 text-center text-xs text-muted-foreground">
          No org-level objectives in this cycle. Add one to get started.
        </div>
      ) : (
        <>
          {/* Analytics cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="border border-border p-3">
              <p className="text-xs text-muted-foreground">Avg Progress</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {analytics.avgProgress}%
              </p>
            </div>
            <div className="border border-border p-3">
              <p className="text-xs text-muted-foreground">On Track</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-500">
                {analytics.onTrack}
              </p>
            </div>
            <div className="border border-border p-3">
              <p className="text-xs text-muted-foreground">At Risk</p>
              <p className="mt-1 text-2xl font-semibold text-amber-400">
                {analytics.atRisk}
              </p>
            </div>
            <div className="border border-border p-3">
              <p className="text-xs text-muted-foreground">Behind</p>
              <p className="mt-1 text-2xl font-semibold text-red-400">
                {analytics.behind}
              </p>
            </div>
            <div className="border border-border p-3">
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-500">
                {analytics.completed}
              </p>
            </div>
          </div>

          {/* Objective list */}
          <OkrDndProvider
            objectives={objectives.map((o) => ({
              id: o.id,
              krIds: o.keyResults.map((kr) => kr.id),
              krTitles: Object.fromEntries(
                o.keyResults.map((kr) => [kr.id, kr.title]),
              ),
            }))}
            organizationId={organization?.id ?? ""}
          >
            <div className="space-y-3">
              {objectives.map((obj) => (
                <ObjectiveCardWithKRs
                  key={obj.id}
                  objective={obj as any}
                  {...(isEditMode
                    ? {
                        onAddKr: openKrForm,
                        onDeleteObjective: setDeleteObj,
                        onEditObjective: (id, title) =>
                          updateObjectiveMutation.mutate({ id, title }),
                      }
                    : {
                        krRenderer: (kr) => (
                          <CheckInKrRow
                            kr={kr as any}
                            cycleId={selectedCycleId!}
                          />
                        ),
                      })}
                />
              ))}
            </div>
          </OkrDndProvider>
        </>
      )}

      {/* Create Objective Dialog */}
      <Dialog open={objFormOpen} onOpenChange={setObjFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create org objective</DialogTitle>
            <DialogDescription>
              Org-level objectives are owned by the whole organization. Admins
              manage progress.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateObjective}>
            <div className="space-y-4">
              <Field>
                <FieldLabel>Title</FieldLabel>
                <Controller
                  control={objectiveForm.control}
                  name="title"
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Improve customer satisfaction"
                    />
                  )}
                />
                <FieldError>
                  {objectiveForm.formState.errors.title?.message}
                </FieldError>
              </Field>
              <Field>
                <FieldLabel>Description (optional)</FieldLabel>
                <Controller
                  control={objectiveForm.control}
                  name="description"
                  render={({ field }) => <Textarea {...field} rows={2} />}
                />
              </Field>
            </div>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => setObjFormOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createObjectiveMutation.isPending}
              >
                {createObjectiveMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <KrFormDialog
        open={krFormOpen}
        onOpenChange={setKrFormOpen}
        mode="create"
        onSubmit={handleCreateKr}
        isPending={createKrMutation.isPending}
      />

      {/* Delete Objective Confirmation */}
      <Dialog open={!!deleteObj} onOpenChange={(o) => !o && setDeleteObj(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete objective?</DialogTitle>
            <DialogDescription>
              This will also delete all its key results. Cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteObj(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteObj) deleteObjectiveMutation.mutate({ id: deleteObj })
              }}
              disabled={deleteObjectiveMutation.isPending}
            >
              {deleteObjectiveMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
