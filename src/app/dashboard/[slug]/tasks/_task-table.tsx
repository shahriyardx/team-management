"use client"

import { useCallback, useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Eye,
  MagnifyingGlassIcon,
  PencilSimple,
  Plus,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Label } from "@/components/ui/label"
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"
import { authClient } from "@/lib/auth-client"

type Member = {
  id: string
  userId: string
  role: string
  user: {
    id: string
    name: string
    email: string
    image: string | null | undefined
  }
}

type Task = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  createdAt: string
  assignees: Array<{
    memberId: string
    member: {
      id: string
      user: {
        id: string
        name: string
        email: string
        image: string | null | undefined
      }
    }
  }>
  createdBy: {
    id: string
    name: string
    email: string
    image: string | null | undefined
  }
  labels: Array<{
    label: {
      id: string
      name: string
      color: string
    }
  }>
}

const statusLabels: Record<string, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
}

const priorityLabels: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
}

const taskSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assigneeIds: z.array(z.string()).optional(),
  labelIds: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
})

type TaskForm = z.infer<typeof taskSchema>

export function TaskTable({ mode }: { mode: "mine" | "all" }) {
  const { session, organization } = useOrganization()

  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10

  const { data, isLoading } = api.task.list.useQuery(
    { organizationId: organization?.id ?? "", skip: 0, take: 100 },
    { enabled: !!organization },
  )
  const tasks = data?.tasks ?? []
  const utils = api.useUtils()

  // Members for assignee dropdown + current member lookup
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

  // Labels for filtering + management
  const { data: labelsData } = api.label.list.useQuery(
    { organizationId: organization?.id ?? "" },
    { enabled: !!organization },
  )
  const availableLabels = labelsData?.labels ?? []
  const createLabelMutation = api.label.create.useMutation({
    onSuccess: () => utils.label.list.invalidate(),
  })
  const [labelCreateOpen, setLabelCreateOpen] = useState(false)
  const [newLabelName, setNewLabelName] = useState("")
  const [newLabelColor, setNewLabelColor] = useState("#6366f1")

  const currentMember = members.find((m) => m.userId === session?.user?.id)
  const canEditAll =
    currentMember?.role === "admin" || currentMember?.role === "owner"

  const visibleTasks = currentMember
    ? tasks.filter((t) => {
        if (t.status === "done") return false
        if (mode === "all") return true
        return t.assignees.some((a) => a.memberId === currentMember.id)
      })
    : []

  // Filters (client-side)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null)
  const [filterLabel, setFilterLabel] = useState<string | null>(null)

  const filteredTasks = visibleTasks.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (
        !t.title.toLowerCase().includes(q) &&
        !(t.description ?? "").toLowerCase().includes(q)
      ) {
        return false
      }
    }
    if (filterPriority && t.priority !== filterPriority) return false
    if (filterStatus && t.status !== filterStatus) return false
    if (
      filterAssignee &&
      !t.assignees.some((a) => a.member.id === filterAssignee)
    )
      return false
    if (filterLabel && !t.labels.some((l) => l.label.id === filterLabel))
      return false
    return true
  })

  const hasActiveFilters =
    searchQuery ||
    filterPriority ||
    filterStatus ||
    filterAssignee ||
    filterLabel

  // Client-side pagination of filtered results
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const paginatedTasks = filteredTasks.slice(
    safePage * PAGE_SIZE,
    (safePage + 1) * PAGE_SIZE,
  )

  // Reset to first page when filters change
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps trigger reset, not used inside
  useEffect(() => {
    setPage(0)
  }, [searchQuery, filterPriority, filterStatus, filterAssignee, filterLabel])

  // Create/edit mutation
  const createMutation = api.task.create.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
  })
  const updateMutation = api.task.update.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
  })
  const deleteMutation = api.task.delete.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
  })

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [viewTask, setViewTask] = useState<Task | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null)

  const form = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      assigneeIds: [],
      labelIds: [],
      dueDate: "",
    },
  })

  const openCreate = useCallback(() => {
    setEditTask(null)
    form.reset()
    setCreateOpen(true)
  }, [form])

  const openEdit = useCallback(
    (task: Task) => {
      setEditTask(task)
      form.reset({
        title: task.title,
        description: task.description ?? "",
        status: task.status as TaskForm["status"],
        priority: task.priority as TaskForm["priority"],
        assigneeIds: task.assignees.map((a) => a.member.id),
        labelIds: task.labels.map((l) => l.label.id),
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      })
      setCreateOpen(true)
    },
    [form],
  )

  const onSubmit = useCallback(
    (data: TaskForm) => {
      if (!organization) return

      const input = {
        title: data.title,
        description: data.description || null,
        status: data.status,
        priority: data.priority,
        assigneeIds: data.assigneeIds?.length ? data.assigneeIds : undefined,
        labelIds: data.labelIds ?? [],
        dueDate: data.dueDate || null,
      }

      if (editTask) {
        updateMutation.mutate({ id: editTask.id, ...input })
      } else {
        createMutation.mutate({ ...input, organizationId: organization.id })
      }
      setCreateOpen(false)
    },
    [editTask, organization, createMutation, updateMutation],
  )

  const handleDelete = useCallback(
    (taskId: string) => {
      deleteMutation.mutate({ id: taskId })
    },
    [deleteMutation],
  )

  const handleStatusChange = useCallback(
    (taskId: string, status: string) => {
      updateMutation.mutate({ id: taskId, status })
    },
    [updateMutation],
  )

  // Comments
  const { data: commentsData } = api.comment.list.useQuery(
    { taskId: viewTask?.id ?? "" },
    { enabled: !!viewTask },
  )
  const comments = commentsData?.comments ?? []
  const [newComment, setNewComment] = useState("")
  const createCommentMutation = api.comment.create.useMutation({
    onSuccess: () => {
      utils.comment.list.invalidate({ taskId: viewTask?.id ?? "" })
      setNewComment("")
    },
  })
  const deleteCommentMutation = api.comment.delete.useMutation({
    onSuccess: () =>
      utils.comment.list.invalidate({ taskId: viewTask?.id ?? "" }),
  })

  if (isLoading || membersLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {mode === "all" ? "All team tasks" : "My tasks"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-3.5" />
            Add task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-50 flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-full rounded-none border border-input bg-transparent pl-8 pr-2.5 text-xs outline-hidden focus:border-ring focus:ring-1 focus:ring-ring/50"
          />
        </div>
        <select
          value={filterStatus ?? ""}
          onChange={(e) => setFilterStatus(e.target.value || null)}
          className="h-8 rounded-none border border-input bg-transparent px-2 text-xs outline-hidden focus:border-ring focus:ring-1 focus:ring-ring/50"
        >
          <option value="">All statuses</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select
          value={filterPriority ?? ""}
          onChange={(e) => setFilterPriority(e.target.value || null)}
          className="h-8 rounded-none border border-input bg-transparent px-2 text-xs outline-hidden focus:border-ring focus:ring-1 focus:ring-ring/50"
        >
          <option value="">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={filterAssignee ?? ""}
          onChange={(e) => setFilterAssignee(e.target.value || null)}
          className="h-8 rounded-none border border-input bg-transparent px-2 text-xs outline-hidden focus:border-ring focus:ring-1 focus:ring-ring/50"
        >
          <option value="">All assignees</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.user.name}
            </option>
          ))}
        </select>
        {availableLabels.length > 0 && (
          <select
            value={filterLabel ?? ""}
            onChange={(e) => setFilterLabel(e.target.value || null)}
            className="h-8 rounded-none border border-input bg-transparent px-2 text-xs outline-hidden focus:border-ring focus:ring-1 focus:ring-ring/50"
          >
            <option value="">All labels</option>
            {availableLabels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        )}
        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearchQuery("")
              setFilterPriority(null)
              setFilterStatus(null)
              setFilterAssignee(null)
              setFilterLabel(null)
            }}
            className="h-8 rounded-none border border-border px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTask ? "Edit task" : "Create task"}</DialogTitle>
            <DialogDescription>
              {editTask
                ? "Update task details."
                : "Add a new task to the board."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Field>
              <FieldLabel htmlFor="task-title">Title</FieldLabel>
              <Input
                id="task-title"
                placeholder="Design the new landing page"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <FieldError errors={[form.formState.errors.title]} />
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="task-desc">Description</FieldLabel>
              <textarea
                id="task-desc"
                placeholder="Add details..."
                {...form.register("description")}
                rows={3}
                className="flex w-full rounded-none border border-border bg-transparent px-3 py-2 text-xs outline-hidden focus:border-foreground disabled:opacity-50 resize-none"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              {editTask ? (
                <div>
                  <Label className="mb-2 block">Status</Label>
                  <Controller
                    name="status"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="h-9 w-full rounded-none text-xs">
                          {field.value
                            ? statusLabels[field.value]
                            : "Select status"}
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="todo">Todo</SelectItem>
                          <SelectItem value="in_progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              ) : null}
              <div>
                <Label className="mb-2 block">Priority</Label>
                <Controller
                  name="priority"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9 w-full rounded-none text-xs">
                        {field.value
                          ? priorityLabels[field.value]
                          : "Select priority"}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="task-due" className="mb-2 block">
                  Due date
                </Label>
                <Input
                  id="task-due"
                  type="date"
                  {...form.register("dueDate")}
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Assignees</Label>
              <Controller
                name="assigneeIds"
                control={form.control}
                render={({ field }) => (
                  <MultiSelect
                    values={field.value ?? []}
                    onValuesChange={field.onChange}
                  >
                    <MultiSelectTrigger className="w-full rounded-none">
                      <MultiSelectValue placeholder="Select assignees" />
                    </MultiSelectTrigger>
                    <MultiSelectContent>
                      {members.map((m) => (
                        <MultiSelectItem
                          key={m.id}
                          value={m.id}
                          badgeLabel={m.user.name}
                        >
                          {m.user.name}
                        </MultiSelectItem>
                      ))}
                    </MultiSelectContent>
                  </MultiSelect>
                )}
              />
            </div>

            <div>
              <Label className="mb-2 block">Labels</Label>
              {availableLabels.length > 0 ? (
                <Controller
                  name="labelIds"
                  control={form.control}
                  render={({ field }) => (
                    <MultiSelect
                      values={field.value ?? []}
                      onValuesChange={field.onChange}
                    >
                      <MultiSelectTrigger className="w-full rounded-none">
                        <MultiSelectValue placeholder="Select labels" />
                      </MultiSelectTrigger>
                      <MultiSelectContent>
                        {availableLabels.map((l) => (
                          <MultiSelectItem
                            key={l.id}
                            value={l.id}
                            badgeLabel={l.name}
                          >
                            {l.name}
                          </MultiSelectItem>
                        ))}
                      </MultiSelectContent>
                    </MultiSelect>
                  )}
                />
              ) : (
                <p className="text-xs text-muted-foreground">No labels yet.</p>
              )}
              {canEditAll && (
                <div className="mt-2">
                  {labelCreateOpen ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Label name"
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        className="h-7 flex-1 rounded-none border border-border bg-transparent px-2 text-xs outline-hidden focus:border-foreground"
                      />
                      <input
                        type="color"
                        value={newLabelColor}
                        onChange={(e) => setNewLabelColor(e.target.value)}
                        className="h-7 w-8 cursor-pointer rounded-none border border-border bg-transparent p-0.5"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (newLabelName.trim() && organization) {
                            createLabelMutation.mutate(
                              {
                                name: newLabelName.trim(),
                                color: newLabelColor,
                                organizationId: organization.id,
                              },
                              {
                                onSuccess: () => {
                                  setNewLabelName("")
                                  setNewLabelColor("#6366f1")
                                  setLabelCreateOpen(false)
                                },
                              },
                            )
                          }
                        }}
                        disabled={
                          !newLabelName.trim() || createLabelMutation.isPending
                        }
                      >
                        Add
                      </Button>
                      <button
                        onClick={() => setLabelCreateOpen(false)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setLabelCreateOpen(true)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      + Create label
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            {editTask && (
              <Button
                variant="destructive"
                onClick={() => setConfirmDelete(editTask)}
              >
                <Trash className="size-3.5" />
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : editTask
                  ? "Save changes"
                  : "Create task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View-only Dialog */}
      <Dialog
        open={!!viewTask}
        onOpenChange={(open) => !open && setViewTask(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewTask?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {viewTask?.description && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {viewTask.description}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Status</span>
                <p className="text-foreground mt-0.5">
                  {viewTask ? statusLabels[viewTask.status] : ""}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Priority</span>
                <p className="text-foreground mt-0.5">
                  {viewTask ? priorityLabels[viewTask.priority] : ""}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Due date</span>
                <p className="text-foreground mt-0.5">
                  {viewTask?.dueDate
                    ? new Date(viewTask.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Created by</span>
                <p className="text-foreground mt-0.5">
                  {viewTask?.createdBy.name}
                </p>
              </div>
            </div>
            {viewTask && viewTask.assignees.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">Assignees</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {viewTask.assignees.map((a) => (
                    <span
                      key={a.member.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs"
                    >
                      <Avatar size="sm" className="size-4">
                        {a.member.user.image ? (
                          <AvatarImage
                            src={a.member.user.image}
                            alt={a.member.user.name}
                          />
                        ) : null}
                        <AvatarFallback className="text-[8px]">
                          {a.member.user.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      {a.member.user.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {viewTask && viewTask.labels.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">Labels</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {viewTask.labels.map((l) => (
                    <span
                      key={l.label.id}
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: l.label.color + "20",
                        color: l.label.color,
                      }}
                    >
                      {l.label.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {/* Comments */}
            <div className="border-t border-border pt-3">
              <h4 className="mb-2 text-xs font-medium text-foreground">
                Comments ({comments.length})
              </h4>
              <div className="mb-2 max-h-40 space-y-2 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No comments yet.
                  </p>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-none border border-border px-2 py-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {c.author.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">
                            {new Date(c.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          {c.authorId === session?.user?.id && (
                            <button
                              onClick={() =>
                                deleteCommentMutation.mutate({ id: c.id })
                              }
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash className="size-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mt-0.5 text-muted-foreground">
                        {c.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  className="flex min-h-0 flex-1 rounded-none border border-border bg-transparent px-2 py-1.5 text-xs outline-hidden focus:border-foreground resize-none"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (viewTask && newComment.trim()) {
                      createCommentMutation.mutate({
                        taskId: viewTask.id,
                        content: newComment.trim(),
                      })
                    }
                  }}
                  disabled={
                    !newComment.trim() || createCommentMutation.isPending
                  }
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => viewTask && setConfirmDelete(viewTask)}
            >
              <Trash className="size-3.5" />
              Delete
            </Button>
            <Button variant="outline" onClick={() => setViewTask(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{confirmDelete?.title}
              &rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDelete) handleDelete(confirmDelete.id)
                setConfirmDelete(null)
                setViewTask(null)
                setCreateOpen(false)
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-none border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Labels</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-16 text-center text-muted-foreground"
                >
                  {hasActiveFilters
                    ? "No tasks match your filters."
                    : mode === "all"
                      ? "No tasks yet."
                      : "No assigned tasks."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedTasks.map((task) => {
                const canEdit =
                  mode === "all"
                    ? canEditAll
                    : canEditAll || task.createdById === session?.user?.id
                const isAssignee = task.assignees.some(
                  (a) => a.memberId === currentMember?.id,
                )
                const canChangeStatus = canEditAll || isAssignee

                return (
                  <TableRow key={task.id}>
                    <TableCell>
                      <span
                        className={`truncate ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}
                      >
                        {task.title}
                      </span>
                    </TableCell>
                    <TableCell>
                      {task.labels.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {task.labels.slice(0, 3).map((l) => (
                            <span
                              key={l.label.id}
                              className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                              style={{
                                backgroundColor: l.label.color + "20",
                                color: l.label.color,
                              }}
                            >
                              {l.label.name}
                            </span>
                          ))}
                          {task.labels.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{task.labels.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          task.priority === "urgent"
                            ? "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-800"
                            : task.priority === "high"
                              ? "bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:ring-orange-800"
                              : "bg-muted text-muted-foreground ring-1 ring-border"
                        }`}
                      >
                        {task.priority !== "medium" && (
                          <WarningCircle className="size-2.5" weight="fill" />
                        )}
                        {priorityLabels[task.priority]}
                      </span>
                    </TableCell>
                    <TableCell>
                      {task.dueDate ? (
                        <span className="text-muted-foreground">
                          {new Date(task.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={task.status}
                        disabled={!canChangeStatus}
                        onValueChange={(value: string) => {
                          handleStatusChange(task.id, value)
                        }}
                      >
                        <SelectTrigger
                          size="sm"
                          className={`${!canChangeStatus ? "opacity-70" : ""}`}
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          {statusLabels[task.status]}
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          <SelectItem value="todo">Todo</SelectItem>
                          <SelectItem value="in_progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {task.assignees.length > 0 ? (
                        <div className="flex -space-x-1">
                          {task.assignees.slice(0, 3).map((a) => (
                            <Avatar
                              key={a.member.id}
                              size="sm"
                              className="ring-1 ring-background"
                            >
                              {a.member.user.image ? (
                                <AvatarImage
                                  src={a.member.user.image}
                                  alt={a.member.user.name}
                                />
                              ) : null}
                              <AvatarFallback>
                                {a.member.user.name?.charAt(0)?.toUpperCase() ??
                                  "?"}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {task.assignees.length > 3 && (
                            <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground ring-1 ring-background">
                              +{task.assignees.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => setViewTask(task)}
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => openEdit(task)}
                          >
                            <PencilSimple className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      {filteredTasks.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Showing {Math.min(filteredTasks.length, safePage * PAGE_SIZE + 1)}
            &ndash;
            {Math.min((safePage + 1) * PAGE_SIZE, filteredTasks.length)} of{" "}
            {filteredTasks.length} tasks
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
              const pageNum = Math.max(
                0,
                Math.min(safePage - 2, totalPages - 5),
              )
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
    </div>
  )
}
