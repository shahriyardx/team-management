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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"
import { ProgressBar } from "@/components/okrs/progress-bar"
import { KrFormDialog, type KrForm } from "@/components/okrs/kr-form-dialog"
import { ObjectiveCardWithKRs } from "@/components/okrs/objective-card-with-krs"
import { OkrDndProvider } from "@/components/okrs/okr-dnd-provider"
import { Badge } from "@/components/ui/badge"

const objectiveSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().optional(),
  ownerId: z.string().min(1, "Member is required."),
})

type ObjectiveForm = z.infer<typeof objectiveSchema>

type OkrCycleItem = {
  id: string
  title: string
  status: string
  locked?: boolean
  startDate: string
  endDate: string
}

type TeamMember = {
  id: string
  userId: string
  role: string
  user: { id: string; name: string; email: string; image?: string | null }
}

type OkrObjective = {
  id: string
  title: string
  status: string
  progress: number
  keyResults: Array<{
    id: string
    title: string
    currentValue: number
    targetValue: number
    unit: string
    description: string | null
    progress: number
    maxValue: number | null
    weight: number
    status: string
    ownerId: string
  }>
  ownerId: string
}

type TeamInfo = {
  id: string
  name: string
  leaderId: string | null
  leader?: {
    id: string
    user: { id: string; name: string; email: string; image?: string | null }
  } | null
  members: TeamMember[]
}

export function TeamMembersOkr({ teamId }: { teamId: string }) {
  const { organization } = useOrganization()
  const utils = api.useUtils()

  // Team info
  const { data: teamData } = api.team.getById.useQuery(
    { teamId, organizationId: organization?.id ?? "" },
    { enabled: !!organization },
  )
  const team = teamData?.team as TeamInfo | undefined

  // Fetch Member records to map TeamMember.userId → Member.id
  const teamMemberUserIds = useMemo(
    () => team?.members.map((m) => m.userId) ?? [],
    [team],
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

  // All cycles for selector
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

  // Auto-select: cycle with today in date range → first active → placeholder
  useEffect(() => {
    if (!selectedCycleId && filteredCycles.length > 0) {
      const now = new Date()
      const current = filteredCycles.find((c) => {
        if (c.status !== "active") return false
        const s = new Date(c.startDate)
        const e = new Date(c.endDate)
        return s <= now && now <= e
      })
      if (current) {
        setSelectedCycleId(current.id)
        return
      }
      const firstActive = filteredCycles.find((c) => c.status === "active")
      if (firstActive) {
        setSelectedCycleId(firstActive.id)
        return
      }
    }
  }, [filteredCycles, selectedCycleId])

  const cycleId = selectedCycleId ?? ""
  const selectedCycle = cycles.find((c) => c.id === cycleId)
  const isActiveCycle = selectedCycle?.status === "active"

  // Member-level objectives for this team's members
  const { data: objectivesData, isLoading: objectivesLoading } =
    api.objective.list.useQuery(
      {
        cycleId: cycleId ?? "",
        organizationId: organization?.id ?? "",
        teamId,
        scope: "member",
      },
      { enabled: !!cycleId && !!organization },
    )
  const objectives = (objectivesData?.objectives ?? []) as OkrObjective[]

  // Create objective
  const [objFormOpen, setObjFormOpen] = useState(false)
  const objectiveForm = useForm<ObjectiveForm>({
    resolver: zodResolver(objectiveSchema) as any,
    defaultValues: { title: "", description: "", ownerId: "" },
  })

  const createObjectiveMutation = api.objective.create.useMutation({
    onSuccess: () => {
      utils.objective.list.invalidate({
        cycleId: cycleId ?? "",
        scope: "member",
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
        cycleId: cycleId ?? "",
        scope: "member",
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
        cycleId: cycleId ?? "",
        scope: "member",
      })
      setDeleteObj(null)
    },
  })

  // Update objective
  const updateObjectiveMutation = api.objective.update.useMutation({
    onSuccess: () => {
      utils.objective.list.invalidate({
        cycleId: cycleId ?? "",
        scope: "member",
      })
    },
  })

  // Group objectives by member (exclude leader)
  const teamMembers = (team?.members ?? []).filter(
    (m) => m.userId !== team?.leader?.user?.id,
  )
  const memberObjectives = useMemo(() => {
    const map = new Map<string, OkrObjective[]>()
    for (const obj of objectives) {
      const existing = map.get(obj.ownerId) ?? []
      existing.push(obj)
      map.set(obj.ownerId, existing)
    }
    return map
  }, [objectives])

  // Analytics
  const analytics = useMemo(() => {
    if (objectives.length === 0)
      return { avgProgress: 0, onTrack: 0, atRisk: 0, behind: 0, completed: 0 }
    const totalP = objectives.reduce((s, o) => s + o.progress, 0)
    const sf = (s: string) => objectives.filter((o) => o.status === s).length
    return {
      avgProgress: Math.round(totalP / objectives.length),
      onTrack: sf("on_track"),
      atRisk: sf("at_risk"),
      behind: sf("behind"),
      completed: sf("completed"),
    }
  }, [objectives])

  const handleCreateObjective = objectiveForm.handleSubmit((data) => {
    if (!organization || !cycleId) return
    createObjectiveMutation.mutate({
      title: data.title,
      description: data.description || null,
      ownerId: data.ownerId,
      cycleId,
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

  if (!team) {
    return <Skeleton className="h-48" />
  }

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium">{team.name} Members</h2>
              <Badge variant="outline" className="text-[10px]">
                {objectives.length} objective
                {objectives.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground sm:hidden">
              {cycles.find((c) => c.id === cycleId)?.title ?? ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-3">
            <Select
              value={selectedYear}
              onValueChange={(v) => {
                setSelectedYear(v)
                setSelectedCycleId(null)
              }}
            >
              <SelectTrigger className="h-7 w-auto min-w-20 rounded-none text-xs">
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
            <Select value={cycleId} onValueChange={setSelectedCycleId}>
              <SelectTrigger className="h-7 w-auto min-w-32 rounded-none text-xs">
                <span className="truncate">
                  {filteredCycles.find((c) => c.id === cycleId)?.title ??
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
          {isActiveCycle && (
            <Button
              onClick={() => {
                objectiveForm.reset()
                setObjFormOpen(true)
              }}
              disabled={!cycleId}
            >
              <Plus className="mr-1 size-3.5" />
              New Objective
            </Button>
          )}
        </div>
      </div>

      {!cycleId || filteredCycles.length === 0 ? (
        <div className="border border-border p-8 text-center text-xs text-muted-foreground">
          {cycles.length === 0
            ? "No OKR cycles yet. Your org admin will create one."
            : `No cycles in ${selectedYear}.`}
        </div>
      ) : objectivesLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : objectives.length === 0 && teamMembers.length === 0 ? (
        <div className="border border-border p-8 text-center text-xs text-muted-foreground">
          No members in this team yet.
        </div>
      ) : (
        <>
          {/* Analytics */}
          {objectives.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="border border-border p-3">
                <p className="text-xs text-muted-foreground">Avg Progress</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {analytics.avgProgress}%
                </p>
              </div>
              <div className="border border-border p-3">
                <p className="text-xs text-muted-foreground">On Track</p>
                <p className="mt-1 text-lg font-semibold text-emerald-500">
                  {analytics.onTrack}
                </p>
              </div>
              <div className="border border-border p-3">
                <p className="text-xs text-muted-foreground">At Risk</p>
                <p className="mt-1 text-lg font-semibold text-amber-400">
                  {analytics.atRisk}
                </p>
              </div>
              <div className="border border-border p-3">
                <p className="text-xs text-muted-foreground">Behind</p>
                <p className="mt-1 text-lg font-semibold text-red-400">
                  {analytics.behind}
                </p>
              </div>
              <div className="border border-border p-3">
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="mt-1 text-lg font-semibold text-emerald-500">
                  {analytics.completed}
                </p>
              </div>
            </div>
          )}

          {/* Per-member sections */}
          <div className="space-y-3">
            {teamMembers.map((member) => {
              const memberId = memberByUserId.get(member.userId)
              const memberObjs = memberId
                ? (memberObjectives.get(memberId) ?? [])
                : []
              const avgProgress =
                memberObjs.length > 0
                  ? Math.round(
                      memberObjs.reduce((s, o) => s + o.progress, 0) /
                        memberObjs.length,
                    )
                  : 0

              return (
                <details key={member.id} className="border border-border">
                  <summary className="flex cursor-pointer flex-col gap-2 px-4 py-3 hover:bg-accent/50 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-7">
                        <AvatarImage src={member.user.image ?? undefined} />
                        <AvatarFallback className="text-[10px]">
                          {member.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-sm font-medium">
                          {member.user.name}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {memberObjs.length} objective
                          {memberObjs.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:w-auto">
                      <div className="flex-1 sm:w-32">
                        <ProgressBar
                          value={avgProgress}
                          size="sm"
                          showLabel={false}
                        />
                      </div>
                      <span className="w-8 text-right text-xs tabular-nums text-muted-foreground shrink-0">
                        {avgProgress}%
                      </span>
                      {isActiveCycle && (
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
                                const memberId = memberByUserId.get(
                                  member.userId,
                                )
                                if (!memberId || !organization || !cycleId)
                                  return

                                for (const item of data) {
                                  const obj =
                                    await utils.client.objective.create.mutate({
                                      title: item.objective.title,
                                      description:
                                        item.objective.description ?? null,
                                      ownerId: memberId,
                                      cycleId,
                                      organizationId: organization.id,
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
                                utils.objective.list.invalidate({
                                  cycleId,
                                  scope: "member",
                                })
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
                      )}
                    </div>
                  </summary>
                  <div className="border-t border-border">
                    {memberObjs.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        No objectives assigned yet.
                      </p>
                    ) : (
                      <div>
                        {memberObjs.map((obj) => (
                          <ObjectiveCardWithKRs
                            key={obj.id}
                            objective={obj as any}
                            onAddKr={isActiveCycle ? openKrForm : undefined}
                            onEditObjective={
                              isActiveCycle
                                ? (id, title) =>
                                    updateObjectiveMutation.mutate({
                                      id,
                                      title,
                                    })
                                : undefined
                            }
                            onDeleteObjective={
                              isActiveCycle ? setDeleteObj : undefined
                            }
                          />
                        ))}
                      </div>
                    )}
                    {isActiveCycle && memberObjs.length > 0 && (
                      <div className="flex justify-end border-t border-border px-4 py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const data = memberObjs.map((obj) => ({
                              objective: {
                                title: obj.title,
                              },
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
                              (c) => c.id === cycleId,
                            )
                            const cycleYear =
                              cycleExport?.startDate?.slice(0, 4) ?? "unknown"
                            const cycleLabel =
                              cycleExport?.title?.replace(/\s+/g, "_") ??
                              "unknown"
                            a.download = `${cycleYear}_${cycleLabel}_${member.user.name.replace(/\s+/g, "_")}.json`
                            a.click()
                            URL.revokeObjectURL(url)
                          }}
                        >
                          <Export className="size-3.5" />
                          Export JSON
                        </Button>
                      </div>
                    )}
                  </div>
                </details>
              )
            })}
          </div>
        </>
      )}

      {/* Create Objective Dialog */}
      <Dialog open={objFormOpen} onOpenChange={setObjFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign objective to member</DialogTitle>
            <DialogDescription>
              Create a member-level objective. This member can check in on
              progress.
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
                    <Input {...field} placeholder="Complete onboarding flow" />
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
                <FieldLabel>Member</FieldLabel>
                <Controller
                  control={objectiveForm.control}
                  name="ownerId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-8 w-full rounded-none text-xs">
                        {teamMembers.find(
                          (m) => memberByUserId.get(m.userId) === field.value,
                        )?.user.name ?? "Select member"}
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {teamMembers.map((m) => (
                          <SelectItem
                            key={m.id}
                            value={memberByUserId.get(m.userId) ?? ""}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="size-5">
                                <AvatarImage src={m.user.image ?? undefined} />
                                <AvatarFallback className="text-[9px]">
                                  {m.user.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              {m.user.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>
                  {objectiveForm.formState.errors.ownerId?.message}
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

      {/* Delete Confirmation */}
      <Dialog open={!!deleteObj} onOpenChange={(o) => !o && setDeleteObj(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete objective?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteObj(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteObj && deleteObjectiveMutation.mutate({ id: deleteObj })
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  return isActiveCycle ? (
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
      {content}
    </OkrDndProvider>
  ) : (
    content
  )
}
