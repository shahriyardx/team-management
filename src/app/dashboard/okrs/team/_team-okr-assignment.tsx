"use client"

import { useCallback, useMemo, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus } from "@phosphor-icons/react"
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
import { ProgressBar } from "@/components/okrs/progress-bar"
import { KrFormDialog, type KrForm } from "@/components/okrs/kr-form-dialog"
import { ObjectiveCard, type ObjectiveItem } from "@/components/okrs/objective-card"
import { KrRow, type KrRowItem } from "@/components/okrs/kr-row"

const objectiveSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().optional(),
  teamId: z.string().min(1, "Team is required."),
})

type ObjectiveForm = z.infer<typeof objectiveSchema>

type Team = {
  id: string
  name: string
}

type OkrObjective = {
  id: string
  title: string
  description: string | null
  progress: number
  status: string
  teamId: string | null
  team?: { id: string; name: string } | null
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

export function TeamOkrAssignment() {
  const { organization } = useOrganization()
  const utils = api.useUtils()

  // Teams list
  const { data: teamsData } = api.team.list.useQuery(
    { organizationId: organization?.id ?? "" },
    { enabled: !!organization },
  )
  const teams: Team[] = (teamsData as { teams: Team[] } | undefined)?.teams ?? []

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
  const [selectedYear, setSelectedYear] = useState<string>("all")

  // Unique years from cycles
  const years = useMemo(() => {
    const yrSet = new Set<string>()
    for (const c of cycles) {
      const yr = c.startDate?.slice(0, 4)
      if (yr) yrSet.add(yr)
    }
    return Array.from(yrSet).sort().reverse()
  }, [cycles])

  // Auto-select active or first cycle
  useMemo(() => {
    if (!selectedCycleId && cycles.length > 0) {
      const target = activeCycle ?? cycles[0]
      if (target) setSelectedCycleId(target.id)
    }
  }, [cycles, activeCycle, selectedCycleId])

  // Objectives — team-level only
  const { data: objectivesData, isLoading: objectivesLoading } = api.objective.list.useQuery(
    {
      cycleId: selectedCycleId ?? "",
      organizationId: organization?.id ?? "",
      scope: "team",
    },
    { enabled: !!selectedCycleId && !!organization },
  )
  const rawObjectives = (objectivesData?.objectives ?? []) as OkrObjective[]

  // Group objectives by team
  const teamObjectives = useMemo(() => {
    const grouped: Record<string, { team: Team; objectives: OkrObjective[] }> = {}
    for (const team of teams) {
      grouped[team.id] = { team, objectives: [] }
    }
    for (const obj of rawObjectives) {
      const tid = obj.teamId
      if (tid && grouped[tid]) {
        grouped[tid].objectives.push(obj)
      }
    }
    return Object.values(grouped).filter((g) => g.objectives.length > 0 || true)
  }, [rawObjectives, teams])

  // Create objective
  const [objFormOpen, setObjFormOpen] = useState(false)
  const objectiveForm = useForm<ObjectiveForm>({
    resolver: zodResolver(objectiveSchema) as any,
    defaultValues: { title: "", description: "", teamId: "" },
  })

  const createObjectiveMutation = api.objective.create.useMutation({
    onSuccess: () => {
      utils.objective.list.invalidate({ cycleId: selectedCycleId ?? "", scope: "team" })
      setObjFormOpen(false)
      objectiveForm.reset()
    },
  })

  // Create KR
  const [krFormOpen, setKrFormOpen] = useState(false)
  const [krObjectiveId, setKrObjectiveId] = useState("")

  const createKrMutation = api.keyResult.create.useMutation({
    onSuccess: () => {
      utils.objective.list.invalidate({ cycleId: selectedCycleId ?? "", scope: "team" })
      setKrFormOpen(false)
    },
  })

  const openKrForm = useCallback((objectiveId: string) => {
    setKrObjectiveId(objectiveId)
    setKrFormOpen(true)
  }, [])

  // Delete
  const [deleteObj, setDeleteObj] = useState<string | null>(null)
  const deleteObjectiveMutation = api.objective.delete.useMutation({
    onSuccess: () => {
      utils.objective.list.invalidate({ cycleId: selectedCycleId ?? "", scope: "team" })
      setDeleteObj(null)
    },
  })

  // Update
  const updateObjectiveMutation = api.objective.update.useMutation({
    onSuccess: () => {
      utils.objective.list.invalidate({ cycleId: selectedCycleId ?? "", scope: "team" })
    },
  })

  const handleCreateObjective = objectiveForm.handleSubmit((data) => {
    if (!organization || !selectedCycleId) return
    createObjectiveMutation.mutate({
      title: data.title,
      description: data.description || null,
      teamId: data.teamId,
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

  // Analytics per team
  const allObjectives = rawObjectives
  const totalAnalytics = useMemo(() => {
    if (allObjectives.length === 0) {
      return { avgProgress: 0, onTrack: 0, atRisk: 0, behind: 0, completed: 0 }
    }
    const totalP = allObjectives.reduce((s, o) => s + o.progress, 0)
    const sf = (s: string) => allObjectives.filter((o) => o.status === s).length
    return {
      avgProgress: Math.round(totalP / allObjectives.length),
      onTrack: sf("on_track"), atRisk: sf("at_risk"), behind: sf("behind"), completed: sf("completed"),
    }
  }, [allObjectives])

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold">Team OKRs</h1>
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
                <span className="truncate">{cycles.find((c) => c.id === selectedCycleId)?.title ?? "Select cycle"}</span>
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
        <Button size="sm" onClick={() => { objectiveForm.reset(); setObjFormOpen(true) }} disabled={!selectedCycleId}>
          <Plus className="mr-1 size-3.5" />Assign Objective
        </Button>
      </div>

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
      ) : allObjectives.length === 0 ? (
        <div className="border border-border p-8 text-center text-xs text-muted-foreground">
          No team objectives assigned yet. Assign one to get started.
        </div>
      ) : (
        <>
          {/* Analytics */}
          <div className="grid grid-cols-5 gap-3">
            <div className="border border-border p-3">
              <p className="text-xs text-muted-foreground">Avg Progress</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{totalAnalytics.avgProgress}%</p>
            </div>
            <div className="border border-border p-3">
              <p className="text-xs text-muted-foreground">On Track</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-500">{totalAnalytics.onTrack}</p>
            </div>
            <div className="border border-border p-3">
              <p className="text-xs text-muted-foreground">At Risk</p>
              <p className="mt-1 text-2xl font-semibold text-amber-400">{totalAnalytics.atRisk}</p>
            </div>
            <div className="border border-border p-3">
              <p className="text-xs text-muted-foreground">Behind</p>
              <p className="mt-1 text-2xl font-semibold text-red-400">{totalAnalytics.behind}</p>
            </div>
            <div className="border border-border p-3">
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-500">{totalAnalytics.completed}</p>
            </div>
          </div>

          {/* Per-team sections */}
          <div className="space-y-6">
            {teamObjectives.map(({ team, objectives: teamObjs }) => {
              const teamAvgProgress = teamObjs.length > 0
                ? Math.round(teamObjs.reduce((s, o) => s + o.progress, 0) / teamObjs.length)
                : 0
              return (
                <div key={team.id} className="border border-border">
                  <div className="flex items-center justify-between bg-muted/30 px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{team.name}</span>
                      <Badge variant="outline" className="text-[10px]">{teamObjs.length} objective{teamObjs.length !== 1 ? "s" : ""}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32">
                        <ProgressBar value={teamAvgProgress} size="sm" showLabel={false} />
                      </div>
                      <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{teamAvgProgress}%</span>
                    </div>
                  </div>
                  <div className="space-y-2 p-3">
                    {teamObjs.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-4">No objectives assigned to this team yet.</p>
                    ) : (
                      teamObjs.map((obj) => (
                        <ObjectiveCard
                          key={obj.id}
                          objective={obj as ObjectiveItem}
                          onAddKr={openKrForm}
                          onEdit={(id, title) => updateObjectiveMutation.mutate({ id, title })}
                          onDelete={(id) => setDeleteObj(id)}
                          krRenderer={(kr) => <KrRow kr={kr as unknown as KrRowItem} />}
                        />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Create Objective Dialog */}
      <Dialog open={objFormOpen} onOpenChange={setObjFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign objective to team</DialogTitle>
            <DialogDescription>Team leaders will fill out these objectives. You cannot assign to individual members.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateObjective}>
            <div className="space-y-4">
              <Field>
                <FieldLabel>Title</FieldLabel>
                <Controller control={objectiveForm.control} name="title" render={({ field }) => <Input {...field} placeholder="Improve team velocity" />} />
                <FieldError>{objectiveForm.formState.errors.title?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel>Description (optional)</FieldLabel>
                <Controller control={objectiveForm.control} name="description" render={({ field }) => <Textarea {...field} rows={2} />} />
              </Field>
              <Field>
                <FieldLabel>Team</FieldLabel>
                <Controller control={objectiveForm.control} name="teamId" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-8 w-full rounded-none text-xs">
                      {teams.find((t) => t.id === field.value)?.name ?? "Select team"}
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
                <FieldError>{objectiveForm.formState.errors.teamId?.message}</FieldError>
              </Field>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setObjFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createObjectiveMutation.isPending}>{createObjectiveMutation.isPending ? "Creating..." : "Create"}</Button>
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

      <Dialog open={!!deleteObj} onOpenChange={(o) => !o && setDeleteObj(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete objective?</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteObj(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteObj && deleteObjectiveMutation.mutate({ id: deleteObj })}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
