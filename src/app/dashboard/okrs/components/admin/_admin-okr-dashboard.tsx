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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"
import { authClient } from "@/lib/auth-client"
import { ProgressBar } from "@/components/okrs/progress-bar"
import { KrFormDialog, type KrForm } from "@/components/okrs/kr-form-dialog"
import { ObjectiveCardWithKRs } from "@/components/okrs/objective-card-with-krs"

const objectiveSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().optional(),
  ownerId: z.string().min(1, "Owner is required."),
})

type ObjectiveForm = z.infer<typeof objectiveSchema>

type Member = {
  id: string
  userId: string
  role: string
  user: { id: string; name: string; email: string; image?: string | null }
}

type OkrObjective = {
  id: string
  title: string
  description: string | null
  progress: number
  status: string
  ownerId: string
  cycleId: string
  owner: { id: string; user: { id: string; name: string; email: string; image?: string | null } }
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
    ownerId: string
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

export function AdminOkrDashboard() {
  const { organization, session } = useOrganization()

  // Member list for owner selects
  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  useEffect(() => {
    if (!organization) {
      setMembersLoading(false)
      return
    }
    setMembersLoading(true)
    authClient.organization
      .listMembers({ query: { organizationSlug: organization.slug } })
      .then((res) => {
        setMembers(res.data?.members ?? [])
        setMembersLoading(false)
      })
      .catch(() => setMembersLoading(false))
  }, [organization])

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

  // Years 2020 to current + 1
  const years = useMemo(() => {
    const cur = new Date().getFullYear()
    return Array.from({ length: cur - 2020 + 2 }, (_, i) => String(2020 + i)).reverse()
  }, [])

  // Auto-select active or first cycle
  useEffect(() => {
    if (!selectedCycleId && cycles.length > 0) {
      const target = activeCycle ?? cycles[0]
      if (target) setSelectedCycleId(target.id)
    }
  }, [cycles, activeCycle, selectedCycleId])

  // Objectives
  const { data: objectivesData, isLoading: objectivesLoading } = api.objective.list.useQuery(
    { cycleId: selectedCycleId ?? "", organizationId: organization?.id ?? "" },
    { enabled: !!selectedCycleId && !!organization },
  )
  const objectives = (objectivesData?.objectives ?? []) as OkrObjective[]

  // Create objective
  const [objFormOpen, setObjFormOpen] = useState(false)
  const objectiveForm = useForm<ObjectiveForm>({
    resolver: zodResolver(objectiveSchema),
    defaultValues: { title: "", description: "", ownerId: "" },
  })

  const createObjectiveMutation = api.objective.create.useMutation({
    onSuccess: () => {
      utils.objective.list.invalidate({ cycleId: selectedCycleId ?? "" })
      setObjFormOpen(false)
      objectiveForm.reset()
    },
  })

  const openObjForm = useCallback(() => {
    if (!selectedCycleId) return
    objectiveForm.reset()
    setObjFormOpen(true)
  }, [selectedCycleId, objectiveForm])

  // Create KR
  const [krFormOpen, setKrFormOpen] = useState(false)
  const [krObjectiveId, setKrObjectiveId] = useState("")

  const createKrMutation = api.keyResult.create.useMutation({
    onSuccess: () => {
      utils.objective.list.invalidate({ cycleId: selectedCycleId ?? "" })
      setKrFormOpen(false)
    },
  })

  const openKrForm = useCallback((objectiveId: string) => {
    setKrObjectiveId(objectiveId)
    setKrFormOpen(true)
  }, [])

  // Update objective
  const updateObjectiveMutation = api.objective.update.useMutation({
    onSuccess: () => {
      utils.objective.list.invalidate({ cycleId: selectedCycleId ?? "" })
    },
  })

  // Delete objective
  const [deleteObj, setDeleteObj] = useState<string | null>(null)
  const deleteObjectiveMutation = api.objective.delete.useMutation({
    onSuccess: () => {
      utils.objective.list.invalidate({ cycleId: selectedCycleId ?? "" })
      setDeleteObj(null)
    },
  })

  // Analytics
  const analytics = useMemo(() => {
    if (objectives.length === 0) {
      return { avgProgress: 0, onTrack: 0, atRisk: 0, behind: 0, completed: 0 }
    }
    const totalProgress = objectives.reduce((s: number, o: { progress: number }) => s + o.progress, 0)
    const statusFilter = (status: string) =>
      objectives.filter((o: { status: string }) => o.status === status).length
    return {
      avgProgress: Math.round(totalProgress / objectives.length),
      onTrack: statusFilter("on_track"),
      atRisk: statusFilter("at_risk"),
      behind: statusFilter("behind"),
      completed: statusFilter("completed"),
    }
  }, [objectives])

  // Member progress summary
  const memberProgress = useMemo(() => {
    const map = new Map<
      string,
      {
        member: Member
        objectives: typeof objectives
        progressTotal: number
        count: number
      }
    >()

    for (const obj of objectives) {
      const existing = map.get(obj.ownerId)
      if (existing) {
        existing.objectives.push(obj)
        existing.progressTotal += obj.progress
        existing.count++
      } else {
        const member = members.find((m) => m.id === obj.ownerId)
        if (member) {
          map.set(obj.ownerId, {
            member,
            objectives: [obj],
            progressTotal: obj.progress,
            count: 1,
          })
        }
      }
    }

    return Array.from(map.values()).map((entry) => ({
      ...entry,
      avgProgress: Math.round(entry.progressTotal / entry.count),
    }))
  }, [objectives, members])

  // Client-side pagination for member progress
  const PAGE_SIZE = 10
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(memberProgress.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const paginatedMembers = memberProgress.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  const handleCreateObjective = objectiveForm.handleSubmit((data) => {
    if (!organization || !selectedCycleId) return
    createObjectiveMutation.mutate({
      title: data.title,
      description: data.description || null,
      ownerId: data.ownerId,
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
          <h1 className="text-base font-semibold">OKRs</h1>
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
                {(selectedYear === "all" ? cycles : cycles.filter((c: OkrCycleItem) => c.startDate?.startsWith(selectedYear))).map((c: OkrCycleItem) => (
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
        <Button size="sm" onClick={openObjForm} disabled={!selectedCycleId}>
          <Plus className="mr-1 size-3.5" />
          New Objective
        </Button>
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
          No objectives in this cycle. Add one to get started.
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

          {/* Member progress */}
          <div className="space-y-2">
            {paginatedMembers.map(({ member, objectives: memberObjs, avgProgress }) => (
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
                      <span className="text-sm font-medium">{member.user.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {memberObjs.length} objective{memberObjs.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <ProgressBar value={avgProgress} size="sm" showLabel={false} />
                    </div>
                    <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                      {avgProgress}%
                    </span>
                  </div>
                </summary>
                <div className="border-t border-border px-4 py-3">
                  <div className="space-y-3">
                    {memberObjs.map((obj) => (
                      <ObjectiveCardWithKRs
                        key={obj.id}
                        objective={obj}
                        onAddKr={openKrForm}
                        onDeleteObjective={setDeleteObj}
                        onEditObjective={(id, title) =>
                          updateObjectiveMutation.mutate({ id, title })
                        }
                      />
                    ))}
                  </div>
                </div>
              </details>
            ))}
          </div>

          {/* Pagination */}
          {memberProgress.length > PAGE_SIZE && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Showing {safePage * PAGE_SIZE + 1}-
                {Math.min((safePage + 1) * PAGE_SIZE, memberProgress.length)} of{" "}
                {memberProgress.length}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = Math.max(0, Math.min(safePage - 2, totalPages - 5))
                  const actualPage = pageNum + i
                  if (actualPage >= totalPages) return null
                  return (
                    <Button
                      key={actualPage}
                      variant={actualPage === safePage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(actualPage)}
                      className="min-w-7"
                    >
                      {actualPage + 1}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Objective Dialog */}
      <Dialog open={objFormOpen} onOpenChange={setObjFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create objective</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateObjective}>
            <div className="space-y-4">
              <Field>
                <FieldLabel>Title</FieldLabel>
                <Controller
                  control={objectiveForm.control}
                  name="title"
                  render={({ field }) => <Input {...field} placeholder="Improve customer satisfaction" />}
                />
                <FieldError>{objectiveForm.formState.errors.title?.message}</FieldError>
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
                <FieldLabel>Owner</FieldLabel>
                <Controller
                  control={objectiveForm.control}
                  name="ownerId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-8 w-full rounded-none text-xs">
                        {members.find((m) => m.id === field.value)?.user.name ?? "Select member"}
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="size-5">
                                <AvatarImage src={m.user.image ?? undefined} />
                                <AvatarFallback className="text-[9px]">{m.user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              {m.user.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>{objectiveForm.formState.errors.ownerId?.message}</FieldError>
              </Field>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setObjFormOpen(false)}>
                Cancel
              </Button>
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
            <DialogDescription>
              This will also delete all its key results and check-ins. This action cannot be undone.
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
