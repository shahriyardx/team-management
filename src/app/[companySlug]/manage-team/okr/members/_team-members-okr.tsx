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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"
import { ProgressBar } from "@/components/okrs/progress-bar"
import { KrFormDialog, type KrForm } from "@/components/okrs/kr-form-dialog"
import { ObjectiveCardWithKRs } from "@/components/okrs/objective-card-with-krs"

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

  // Years 2020 to current + 1
  const years = useMemo(() => {
    const cur = new Date().getFullYear()
    return Array.from({ length: cur - 2020 + 2 }, (_, i) =>
      String(2020 + i),
    ).reverse()
  }, [])

  // Auto-select active or first cycle
  useMemo(() => {
    if (!selectedCycleId && cycles.length > 0) {
      const target = activeCycle ?? cycles[0]
      if (target) setSelectedCycleId(target.id)
    }
  }, [cycles, activeCycle, selectedCycleId])

  const cycleId = selectedCycleId ?? ""

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

  // Group objectives by member
  const teamMembers = team?.members ?? []
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium">{team.name} Members</h2>
          <Badge variant="outline" className="text-[10px]">
            {objectives.length} objective{objectives.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Select
            value={selectedYear}
            onValueChange={(v) => {
              setSelectedYear(v)
              setSelectedCycleId(null)
            }}
          >
            <SelectTrigger className="h-7 w-auto min-w-20 rounded-none text-xs">
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
          <Select value={cycleId} onValueChange={setSelectedCycleId}>
            <SelectTrigger className="h-7 w-auto min-w-32 rounded-none text-xs">
              <span className="truncate">
                {cycles.find((c) => c.id === cycleId)?.title ?? "Select cycle"}
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
        </div>
      </div>

      {!cycleId || cycles.length === 0 ? (
        <div className="border border-border p-8 text-center text-xs text-muted-foreground">
          No OKR cycles yet. Your org admin will create one.
        </div>
      ) : objectivesLoading ? (
        <div className="space-y-4">
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
            <div className="grid grid-cols-5 gap-3">
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
          <div className="space-y-4">
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
                  <summary className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-accent/50">
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
                        {member.role === "leader" && (
                          <Badge variant="outline" className="ml-2 text-[9px]">
                            Leader
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32">
                        <ProgressBar
                          value={avgProgress}
                          size="sm"
                          showLabel={false}
                        />
                      </div>
                      <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
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
                            onEditObjective={(id, title) =>
                              updateObjectiveMutation.mutate({ id, title })
                            }
                            onDeleteObjective={setDeleteObj}
                          />
                        ))}
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
}
