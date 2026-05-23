"use client"

import { useCallback, useMemo, useState } from "react"
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
import { Badge } from "@/components/ui/badge"
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
  const { data: activeCycleData } = api.okrCycle.getActive.useQuery(
    { organizationId: organization?.id ?? "" },
    { enabled: !!organization },
  )
  const cycles = (cyclesData?.cycles ?? []) as OkrCycleItem[]
  const activeCycle = activeCycleData?.cycle as OkrCycleItem | null
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()))
  const [isEditMode, setIsEditMode] = useState(false)

  // Years 2020 to current + 1
  const years = useMemo(() => {
    const cur = new Date().getFullYear()
    return Array.from({ length: cur - 2020 + 2 }, (_, i) => String(2020 + i)).reverse()
  }, [])

  // Auto-select active or first cycle
  useMemo(() => {
    if (!selectedCycleId && cycles.length > 0) {
      const target = activeCycle ?? cycles[0]
      if (target) setSelectedCycleId(target.id)
    }
  }, [cycles, activeCycle, selectedCycleId])

  // Objectives — org-level only (scope: "org")
  const { data: objectivesData, isLoading: objectivesLoading } = api.objective.list.useQuery(
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
      utils.objective.list.invalidate({ cycleId: selectedCycleId ?? "", scope: "org" })
      setObjFormOpen(false)
      objectiveForm.reset()
    },
  })

  // Create KR
  const [krFormOpen, setKrFormOpen] = useState(false)
  const [krObjectiveId, setKrObjectiveId] = useState("")

  const createKrMutation = api.keyResult.create.useMutation({
    onSuccess: () => {
      utils.objective.list.invalidate({ cycleId: selectedCycleId ?? "", scope: "org" })
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
      utils.objective.list.invalidate({ cycleId: selectedCycleId ?? "", scope: "org" })
      setDeleteObj(null)
    },
  })

  // Update objective
  const updateObjectiveMutation = api.objective.update.useMutation({
    onSuccess: () => {
      utils.objective.list.invalidate({ cycleId: selectedCycleId ?? "", scope: "org" })
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold">Org OKRs</h1>
          <div className="flex items-center gap-1">
            <Select value={selectedYear} onValueChange={(v) => { setSelectedYear(v); setSelectedCycleId(null) }}>
              <SelectTrigger className="h-8 w-auto min-w-20 rounded-none text-xs">
                {selectedYear === "all" ? "All years" : selectedYear}
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">All years</SelectItem>
                {years.map((yr) => (
                  <SelectItem key={yr} value={yr}>{yr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCycleId ?? ""} onValueChange={setSelectedCycleId}>
              <SelectTrigger className="h-8 w-auto min-w-32 rounded-none text-xs">
                <span className="truncate">
                  {cycles.find((c) => c.id === selectedCycleId)?.title ?? "Select cycle"}
                </span>
              </SelectTrigger>
              <SelectContent position="popper">
                {(selectedYear === "all" ? cycles : cycles.filter((c) => c.startDate?.startsWith(selectedYear))).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <span>{c.title}</span>
                      <Badge variant="outline" className="text-[10px]">{c.status}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditMode((p) => !p)}
          >
            {isEditMode ? <Eye className="mr-1 size-3.5" /> : <PencilSimple className="mr-1 size-3.5" />}
            {isEditMode ? "View" : "Edit"}
          </Button>
          {isEditMode && (
            <Button size="sm" onClick={() => { objectiveForm.reset(); setObjFormOpen(true) }} disabled={!selectedCycleId}>
              <Plus className="mr-1 size-3.5" />
              New Objective
            </Button>
          )}
        </div>
      </div>

      {/* Loading */}
      {objectivesLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20" />)}
          </div>
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : !selectedCycleId ? (
        <div className="border border-border p-8 text-center text-xs text-muted-foreground">
          No cycles yet.
        </div>
      ) : objectives.length === 0 ? (
        <div className="border border-border p-8 text-center text-xs text-muted-foreground">
          No org-level objectives in this cycle. Add one to get started.
        </div>
      ) : (
        <>
          {/* Analytics cards */}
          <div className="grid grid-cols-5 gap-3">
            <div className="border border-border p-3">
              <p className="text-xs text-muted-foreground">Avg Progress</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{analytics.avgProgress}%</p>
            </div>
            <div className="border border-border p-3">
              <p className="text-xs text-muted-foreground">On Track</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-500">{analytics.onTrack}</p>
            </div>
            <div className="border border-border p-3">
              <p className="text-xs text-muted-foreground">At Risk</p>
              <p className="mt-1 text-2xl font-semibold text-amber-400">{analytics.atRisk}</p>
            </div>
            <div className="border border-border p-3">
              <p className="text-xs text-muted-foreground">Behind</p>
              <p className="mt-1 text-2xl font-semibold text-red-400">{analytics.behind}</p>
            </div>
            <div className="border border-border p-3">
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-500">{analytics.completed}</p>
            </div>
          </div>

          {/* Objective list */}
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
                        <CheckInKrRow kr={kr as any} cycleId={selectedCycleId!} />
                      ),
                    })}
              />
            ))}
          </div>
        </>
      )}

      {/* Create Objective Dialog */}
      <Dialog open={objFormOpen} onOpenChange={setObjFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create org objective</DialogTitle>
            <DialogDescription>Org-level objectives are owned by the whole organization. Admins manage progress.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateObjective}>
            <div className="space-y-4">
              <Field>
                <FieldLabel>Title</FieldLabel>
                <Controller control={objectiveForm.control} name="title" render={({ field }) => <Input {...field} placeholder="Improve customer satisfaction" />} />
                <FieldError>{objectiveForm.formState.errors.title?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel>Description (optional)</FieldLabel>
                <Controller control={objectiveForm.control} name="description" render={({ field }) => <Textarea {...field} rows={2} />} />
              </Field>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setObjFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createObjectiveMutation.isPending}>
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
            <DialogDescription>This will also delete all its key results. Cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteObj(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (deleteObj) deleteObjectiveMutation.mutate({ id: deleteObj }) }} disabled={deleteObjectiveMutation.isPending}>
              {deleteObjectiveMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
