"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Export, UploadSimple } from "@phosphor-icons/react"
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
import { ProgressBar } from "@/components/okrs/progress-bar"
import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"
import { KrFormDialog, type KrForm } from "@/components/okrs/kr-form-dialog"
import { ObjectiveCardWithKRs } from "@/components/okrs/objective-card-with-krs"
import { OkrDndProvider } from "@/components/okrs/okr-dnd-provider"

const objectiveSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().optional(),
  teamId: z.string().min(1, "Team is required."),
})

type ObjectiveForm = z.infer<typeof objectiveSchema>

type OkrObjective = {
  id: string
  title: string
  description: string | null
  progress: number
  status: string
  teamId: string | null
  ownerId: string | null
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

type TeamItem = {
  id: string
  name: string
}

export default function TeamOkrAssignment() {
  const { organization } = useOrganization()
  const utils = api.useUtils()

  // Teams with members
  const { data: teamsData } = api.team.list.useQuery(
    { organizationId: organization?.id ?? "" },
    { enabled: !!organization },
  )
  const teams = (teamsData?.teams ?? []) as TeamItem[]

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

  // Objectives for selected cycle (all teams)
  const { data: objectivesData, isLoading } = api.objective.list.useQuery(
    { cycleId: selectedCycleId ?? "", organizationId: organization?.id ?? "" },
    { enabled: !!selectedCycleId && !!organization },
  )
  const objectives = (objectivesData?.objectives ?? []) as OkrObjective[]

  // Create objective
  const [objFormOpen, setObjFormOpen] = useState(false)
  const objectiveForm = useForm<ObjectiveForm>({
    resolver: zodResolver(objectiveSchema) as any,
    defaultValues: { title: "", description: "", teamId: "" },
  })
  const createObjectiveMutation = api.objective.create.useMutation({
    onSuccess: () => {
      utils.objective.list.invalidate()
      setObjFormOpen(false)
      objectiveForm.reset()
    },
  })

  // Create KR
  const [krFormOpen, setKrFormOpen] = useState(false)
  const [krObjectiveId, setKrObjectiveId] = useState("")
  const createKrMutation = api.keyResult.create.useMutation({
    onSuccess: () => {
      utils.objective.list.invalidate()
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
      utils.objective.list.invalidate()
      setDeleteObj(null)
    },
  })

  // Update objective
  const updateObjectiveMutation = api.objective.update.useMutation({
    onSuccess: () => {
      utils.objective.list.invalidate()
    },
  })

  const handleCreateObjective = objectiveForm.handleSubmit((data) => {
    if (!organization || !selectedCycleId) return
    createObjectiveMutation.mutate({
      title: data.title,
      description: data.description || null,
      cycleId: selectedCycleId,
      teamId: data.teamId,
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

  // Group objectives by team
  const teamSections = useMemo(() => {
    const map = new Map<string, OkrObjective[]>()
    for (const t of teams) {
      map.set(t.id, [])
    }
    for (const obj of objectives) {
      if (!obj.teamId) continue
      const arr = map.get(obj.teamId)
      if (arr) arr.push(obj)
    }
    return Array.from(map.entries())
      .map(([id, objectives]) => ({
        team: { id, name: teams.find((t) => t.id === id)?.name ?? id },
        objectives,
      }))
      .sort((a, b) => a.team.name.localeCompare(b.team.name))
  }, [objectives, teams])

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold">Team OKR</h1>
          <p className="text-xs text-muted-foreground sm:hidden">
            {cycles.find((c) => c.id === selectedCycleId)?.title ?? ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            onClick={() => {
              objectiveForm.reset()
              setObjFormOpen(true)
            }}
            disabled={!selectedCycleId}
          >
            <Plus className="mr-1 size-3.5" />
            Add Objective
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : !selectedCycleId ? (
        <div className="border border-border p-8 text-center text-xs text-muted-foreground">
          {cycles.length === 0
            ? "No cycles yet."
            : `No cycles in ${selectedYear}.`}
        </div>
      ) : teamSections.length === 0 ? (
        <div className="border border-border p-8 text-center text-xs text-muted-foreground">
          No teams. Create one first.
        </div>
      ) : (
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
            {teamSections.map(({ team, objectives }) => {
              const avg =
                objectives.length > 0
                  ? Math.round(
                      objectives.reduce((s, o) => s + o.progress, 0) /
                        objectives.length,
                    )
                  : 0
              return (
                <details key={team.id} className="border border-border">
                  <summary className="flex cursor-pointer flex-col gap-2 px-4 py-3 hover:bg-accent/50 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-medium">{team.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {objectives.length} objective
                        {objectives.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 sm:w-auto">
                      <div className="flex-1 sm:w-32">
                        <ProgressBar value={avg} size="sm" showLabel={false} />
                      </div>
                      <span className="w-8 text-right text-xs tabular-nums text-muted-foreground shrink-0">
                        {avg}%
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.createElement("input")
                          input.type = "file"
                          input.accept = ".json"
                          input.onchange = async () => {
                            const file = input.files?.[0]
                            if (!file) return
                            try {
                              const text = await file.text()
                              const data = JSON.parse(text)
                              if (!organization || !selectedCycleId) return
                              for (const item of data) {
                                const obj =
                                  await utils.client.objective.create.mutate({
                                    title: item.objective.title,
                                    description:
                                      item.objective.description ?? null,
                                    teamId: team.id,
                                    cycleId: selectedCycleId,
                                  })
                                for (const kr of item.keyResults ?? []) {
                                  await utils.client.keyResult.create.mutate({
                                    title: kr.title,
                                    description: kr.description ?? null,
                                    targetValue: kr.targetValue,
                                    unit: kr.unit ?? "number",
                                    weight: kr.weight ?? 1,
                                    objectiveId: obj.objective.id,
                                    organizationId: organization.id,
                                  })
                                }
                              }
                              utils.objective.list.invalidate()
                            } catch (e) {
                              console.error("Import failed:", e)
                            }
                          }
                          input.click()
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      >
                        <UploadSimple className="size-4" />
                      </button>
                    </div>
                  </summary>
                  <div className="border-t border-border">
                    {objectives.length === 0 ? (
                      <div className="p-8 text-center text-xs text-muted-foreground">
                        No objectives assigned to this team yet.
                      </div>
                    ) : (
                      <>
                        <div>
                          {objectives.map((obj) => (
                            <ObjectiveCardWithKRs
                              key={obj.id}
                              objective={obj as any}
                              onAddKr={openKrForm}
                              onDeleteObjective={setDeleteObj}
                              onEditObjective={(id, title) =>
                                updateObjectiveMutation.mutate({ id, title })
                              }
                            />
                          ))}
                        </div>
                        <div className="flex justify-end border-t border-border px-4 py-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const data = objectives.map((obj) => ({
                                objective: { title: obj.title },
                                keyResults: obj.keyResults.map((kr) => ({
                                  title: kr.title,
                                  description: kr.description,
                                  targetValue: kr.targetValue,
                                  unit: kr.unit,
                                  weight: kr.weight,
                                  currentValue: 0,
                                  status: "not_started",
                                })),
                              }))
                              const blob = new Blob(
                                [JSON.stringify(data, null, 2)],
                                { type: "application/json" },
                              )
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement("a")
                              a.href = url
                              const cycleExport = cycles.find(
                                (c) => c.id === selectedCycleId,
                              )
                              const cycleYear =
                                cycleExport?.startDate?.slice(0, 4) ?? "unknown"
                              const cycleLabel =
                                cycleExport?.title?.replace(/\s+/g, "_") ??
                                "unknown"
                              a.download = `${cycleYear}_${cycleLabel}_${team.name.replace(/\s+/g, "_")}.json`
                              a.click()
                              URL.revokeObjectURL(url)
                            }}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Export className="size-3.5" />
                            Export
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </details>
              )
            })}
          </div>
        </OkrDndProvider>
      )}

      {/* Create Objective Dialog */}
      <Dialog open={objFormOpen} onOpenChange={setObjFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Objective</DialogTitle>
            <DialogDescription>
              Assign a new objective to a team for the selected cycle.
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
                    <Input {...field} placeholder="Improve team velocity" />
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
              <Field>
                <FieldLabel>Team</FieldLabel>
                <Controller
                  control={objectiveForm.control}
                  name="teamId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-8 w-full rounded-none text-xs">
                        {field.value
                          ? teams.find((t) => t.id === field.value)?.name
                          : "Select team"}
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {teams.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>
                  {objectiveForm.formState.errors.teamId?.message}
                </FieldError>
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
