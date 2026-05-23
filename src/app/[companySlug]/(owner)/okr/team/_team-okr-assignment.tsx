"use client"

import { useCallback, useMemo, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CaretDown, CaretRight, Plus } from "@phosphor-icons/react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

type TeamWithMembers = {
  id: string
  name: string
  leader: { id: string; user: { id: string; name: string; email: string; image?: string | null } } | null
  members: Array<{
    id: string
    userId: string
    role: string
    user: { id: string; name: string; email: string; image?: string | null }
  }>
}

type TeamMember = TeamWithMembers["members"][number]

export default function TeamOkrAssignment() {
  const { organization } = useOrganization()
  const utils = api.useUtils()

  // Teams with members
  const { data: teamsData } = api.team.list.useQuery(
    { organizationId: organization?.id ?? "" },
    { enabled: !!organization },
  )
  const teams = (teamsData?.teams ?? []) as TeamWithMembers[]

  // Member ID mapping (userId → memberId)
  const teamMemberUserIds = useMemo(
    () => teams.flatMap((t) => t.members.map((m) => m.userId)),
    [teams],
  )
  const { data: memberRecords } = api.member.listByUserIds.useQuery(
    { userIds: teamMemberUserIds, organizationId: organization?.id ?? "" },
    { enabled: teamMemberUserIds.length > 0 && !!organization },
  )
  const memberByUserId = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of memberRecords?.members ?? []) {
      map.set(m.userId, m.id)
    }
    return map
  }, [memberRecords])

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

  const [collapsedTeams, setCollapsedTeams] = useState<Set<string>>(new Set())
  const toggleTeam = useCallback((teamId: string) => {
    setCollapsedTeams((prev) => {
      const next = new Set(prev)
      if (next.has(teamId)) next.delete(teamId)
      else next.add(teamId)
      return next
    })
  }, [])

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

  // Group objectives by team, then by member within each team
  type TeamSection = {
    team: { id: string; name: string; members: TeamMember[] }
    teamObjectives: OkrObjective[]
    memberObjectives: Map<string, OkrObjective[]>
  }
  const teamSections = useMemo(() => {
    const map = new Map<string, TeamSection>()
    for (const t of teams) {
      map.set(t.id, { team: t, teamObjectives: [], memberObjectives: new Map() })
    }
    for (const obj of objectives) {
      if (!obj.teamId) continue
      const section = map.get(obj.teamId)
      if (!section) continue
      if (obj.ownerId) {
        const existing = section.memberObjectives.get(obj.ownerId) ?? []
        existing.push(obj)
        section.memberObjectives.set(obj.ownerId, existing)
      } else {
        section.teamObjectives.push(obj)
      }
    }
    return Array.from(map.values()).sort((a, b) =>
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
      ) : teamSections.length === 0 ? (
        <div className="border border-border p-8 text-center text-xs text-muted-foreground">
          No teams. Create one first.
        </div>
      ) : (
        <div className="space-y-6">
          {teamSections.map(({ team, teamObjectives, memberObjectives }) => {
            const collapsed = collapsedTeams.has(team.id)
            const totalObjs = teamObjectives.length +
              Array.from(memberObjectives.values()).reduce((s, o) => s + o.length, 0)
            return (
            <div key={team.id} className="border border-border">
              <button
                onClick={() => toggleTeam(team.id)}
                className="flex w-full items-center gap-2 border-b border-border bg-muted/30 px-4 py-2 cursor-pointer text-left"
              >
                {collapsed
                  ? <CaretRight className="size-3 text-muted-foreground shrink-0" />
                  : <CaretDown className="size-3 text-muted-foreground shrink-0" />}
                <span className="text-sm font-medium">{team.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {totalObjs} objective
                  {totalObjs !== 1 ? "s" : ""}
                </span>
              </button>
              {!collapsed && (
                <div className="divide-y divide-border">
                  {/* Member collapsible cards */}
                  {Array.from(memberObjectives.entries()).map(([memberId, memberObjs]) => {
                    const member = team.members.find(
                      (m) => memberByUserId.get(m.userId) === memberId
                    )
                    if (!member) return null
                    const avgProgress = memberObjs.length > 0
                      ? Math.round(memberObjs.reduce((s, o) => s + o.progress, 0) / memberObjs.length)
                      : 0
                    return (
                      <details key={memberId} className="border border-border">
                        <summary className="flex cursor-pointer flex-col gap-2 px-4 py-3 hover:bg-accent/50 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-7">
                              <AvatarImage src={member.user.image ?? undefined} />
                              <AvatarFallback className="text-[10px]">
                                {member.user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="text-sm font-medium">{member.user.name}</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                {memberObjs.length} objective
                                {memberObjs.length !== 1 ? "s" : ""}
                              </span>
                              {member.role === "leader" && (
                                <Badge variant="outline" className="ml-2 text-[9px]">
                                  Leader
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 sm:w-auto">
                            <div className="flex-1 sm:w-32">
                              <ProgressBar value={avgProgress} size="sm" showLabel={false} />
                            </div>
                            <span className="w-8 text-right text-xs tabular-nums text-muted-foreground shrink-0">
                              {avgProgress}%
                            </span>
                          </div>
                        </summary>
                        <div className="border-t border-border px-4 py-3">
                          {memberObjs.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-2">
                              No objectives assigned yet.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {memberObjs.map((obj) => (
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
                          )}
                        </div>
                      </details>
                    )
                  })}
                  {/* Team-level objectives */}
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
                  {totalObjs === 0 && (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      No objectives assigned to this team yet.
                    </div>
                  )}
                </div>
              )}
            </div>
            )
          })}
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
