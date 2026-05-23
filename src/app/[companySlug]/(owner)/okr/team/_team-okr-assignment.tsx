"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/trpc/client"
import { KrFormDialog, type KrForm } from "@/components/okrs/kr-form-dialog"
import { ObjectiveCardWithKRs } from "@/components/okrs/objective-card-with-krs"

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

export default function TeamOkrAssignment() {
  const { organization } = useOrganization()
  const utils = api.useUtils()

  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    if (!organization) return
    authClient.organization
      .getFullOrganization({
        query: { organizationId: organization.id },
      })
      .then((res) => {
        const orgData = res.data as {
          teams?: Array<{ id: string; name: string }>
        } | null
        setTeams(
          (orgData?.teams ?? []).filter((t) => t.name !== organization.name),
        )
      })
  }, [organization])

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
  const [selectedYear, setSelectedYear] = useState<string>(
    String(new Date().getFullYear()),
  )

  const years = useMemo(() => {
    const cur = new Date().getFullYear()
    return Array.from({ length: cur - 2020 + 2 }, (_, i) =>
      String(2020 + i),
    ).reverse()
  }, [])

  useMemo(() => {
    if (!selectedCycleId && cycles.length > 0) {
      const target = activeCycle ?? cycles[0]
      if (target) setSelectedCycleId(target.id)
    }
  }, [cycles, activeCycle, selectedCycleId])

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

  // Group objectives by team
  const objectivesByTeam = useMemo(() => {
    const map: Record<
      string,
      { team: { id: string; name: string }; objectives: OkrObjective[] }
    > = {}
    for (const obj of objectives) {
      if (!obj.teamId) continue
      if (!map[obj.teamId]) {
        const team = teams.find((t) => t.id === obj.teamId)
        map[obj.teamId] = {
          team: team ?? { id: obj.teamId, name: "Unknown" },
          objectives: [],
        }
      }
      map[obj.teamId].objectives.push(obj)
    }
    // Add teams with no objectives
    for (const t of teams) {
      if (!map[t.id]) {
        map[t.id] = { team: t, objectives: [] }
      }
    }
    return Object.values(map).sort((a, b) =>
      a.team.name.localeCompare(b.team.name),
    )
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
                  {selectedYear === "all" ? "All years" : selectedYear}
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">All years</SelectItem>
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
                  {(selectedYear === "all"
                    ? cycles
                    : cycles.filter((c) => c.startDate?.startsWith(selectedYear))
                  ).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span>{c.title}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {c.status}
                        </Badge>
                      </div>
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
          No cycles yet.
        </div>
      ) : objectivesByTeam.length === 0 ? (
        <div className="border border-border p-8 text-center text-xs text-muted-foreground">
          No teams. Create one first.
        </div>
      ) : (
        <div className="space-y-6">
          {objectivesByTeam.map(({ team, objectives: teamObjectives }) => (
            <div key={team.id} className="border border-border">
              <div className="border-b border-border bg-muted/30 px-4 py-2">
                <span className="text-sm font-medium">{team.name}</span>
                <span className="ml-2 text-[10px] text-muted-foreground">
                  {teamObjectives.length} objective
                  {teamObjectives.length !== 1 ? "s" : ""}
                </span>
              </div>
              {teamObjectives.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No objectives assigned to this team yet.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {teamObjectives.map((obj) => (
                    <div key={obj.id} className="p-4">
                      <ObjectiveCardWithKRs
                        objective={obj as any}
                        onAddKr={openKrForm}
                        onDeleteObjective={setDeleteObj}
                        onEditObjective={(id, title) =>
                          updateObjectiveMutation.mutate({ id, title })
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
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
