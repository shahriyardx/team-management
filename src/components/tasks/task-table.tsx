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
import { Textarea } from "@/components/ui/textarea"
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
  dueDate: z.string().optional(),
})

type TaskForm = z.infer<typeof taskSchema>

const commentSchema = z.object({
  content: z.string().min(1, "Comment is required."),
})

type CommentForm = z.infer<typeof commentSchema>

export function TaskTable({ mode }: { mode: "mine" | "all" | "assigned" }) {
  const { session, organization } = useOrganization()

  const [page, setPage] = useState(0)
  const [showDone, setShowDone] = useState(false)
  const PAGE_SIZE = 10

  const activeTeamId = session?.session?.activeTeamId

  const { data, isLoading } = api.task.list.useQuery(
    { organizationId: organization?.id ?? "", teamId: activeTeamId ?? null, skip: 0, take: 100 },
    { enabled: !!organization },
  )
  const tasks = data?.tasks ?? []
  const utils = api.useUtils()

  // Org members for current member lookup + role check
  const [orgMembers, setOrgMembers] = useState<Member[]>([])
  const [orgMembersLoading, setOrgMembersLoading] = useState(true)
  useEffect(() => {
    if (!organization) {
      setOrgMembersLoading(false)
      return
    }
    setOrgMembersLoading(true)
    authClient.organization
      .listMembers({ query: { organizationSlug: organization.slug } })
      .then((res) => {
        setOrgMembers(res.data?.members ?? [])
        setOrgMembersLoading(false)
      })
      .catch(() => setOrgMembersLoading(false))
  }, [organization])

  // Team members for scoped assignee dropdown
  const [teamUserIds, setTeamUserIds] = useState<Set<string>>(new Set())
  const [teamLoading, setTeamLoading] = useState(false)
  useEffect(() => {
    if (!activeTeamId || !organization) {
      setTeamUserIds(new Set())
      setTeamLoading(false)
      return
    }
    setTeamLoading(true)
    authClient.organization
      .listTeamMembers({ query: { teamId: activeTeamId } })
      .then((res) => {
        const ids = (res.data ?? []).map((m: { userId: string }) => m.userId)
        setTeamUserIds(new Set(ids))
        setTeamLoading(false)
      })
      .catch(() => setTeamLoading(false))
  }, [activeTeamId, organization])

  const assigneeMembers = activeTeamId
    ? orgMembers.filter((m) => teamUserIds.has(m.userId))
    : orgMembers.filter((m) => m.role === "owner" || m.role === "admin")

  const membersLoading = activeTeamId ? orgMembersLoading || teamLoading : orgMembersLoading

  const currentMember = orgMembers.find((m) => m.userId === session?.user?.id)
  const canEditAll =
    currentMember?.role === "admin" || currentMember?.role === "owner"

  const visibleTasks = currentMember
    ? tasks.filter((t) => {
        if (!showDone && t.status === "done") return false
        if (mode === "assigned") return t.createdBy.id === currentMember.userId
        if (mode === "all") return true
        return t.assignees.some((a) => a.memberId === currentMember.id)
      })
    : []

  // Filters (client-side)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null)

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
    return true
  })

  const hasActiveFilters =
    searchQuery ||
    filterPriority ||
    filterStatus ||
    filterAssignee

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
  }, [searchQuery, filterPriority, filterStatus, filterAssignee])

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
        dueDate: data.dueDate || null,
      }

      if (editTask) {
        updateMutation.mutate({ id: editTask.id, ...input })
      } else {
        createMutation.mutate({ ...input, organizationId: organization.id, teamId: activeTeamId ?? undefined })
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

  const changeStatusMutation = api.task.changeStatus.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
  })

  const handleStatusChange = useCallback(
    (taskId: string, status: string) => {
      changeStatusMutation.mutate({ id: taskId, status: status as "todo" | "in_progress" | "done" })
    },
    [changeStatusMutation],
  )

  // Comments
  const { data: commentsData } = api.comment.list.useQuery(
    { taskId: viewTask?.id ?? "" },
    { enabled: !!viewTask },
  )
  const comments = commentsData?.comments ?? []

  const commentForm = useForm<CommentForm>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "" },
  })

  useEffect(() => {
    commentForm.reset()
  }, [viewTask?.id, commentForm])

  const createCommentMutation = api.comment.create.useMutation({
    onSuccess: () => {
      utils.comment.list.invalidate({ taskId: viewTask?.id ?? "" })
      commentForm.reset()
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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {mode === "all" ? "All Tasks" : mode === "assigned" ? "Assigned Tasks" : "My tasks"}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {mode === "assigned" ? "Tasks you assigned to others" : mode === "mine" ? "Tasks assigned to you" : "All tasks in the team"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openCreate}>
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
          {assigneeMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.user.name}
            </option>
          ))}
        </select>
        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearchQuery("")
              setFilterPriority(null)
              setFilterStatus(null)
              setFilterAssignee(null)
            }}
            className="h-8 rounded-none border border-border px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear
          </button>
        )}
        <button
          onClick={() => setShowDone(!showDone)}
          className={`h-8 rounded-none border px-2 text-xs transition-colors ${
            showDone
              ? "border-ring bg-accent text-foreground"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          Show done
        </button>
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
              <Textarea
                id="task-desc"
                placeholder="Add details..."
                {...form.register("description")}
                rows={3}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              {editTask ? (
                <Field>
                  <FieldLabel>Status</FieldLabel>
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
                </Field>
              ) : null}
              <Field>
                <FieldLabel>Priority</FieldLabel>
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
              </Field>
              <Field>
                <FieldLabel>Due date</FieldLabel>
                <Input type="date" {...form.register("dueDate")} />
              </Field>
            </div>

            <Field>
              <FieldLabel>Assignees</FieldLabel>
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
                      {assigneeMembers.map((m) => (
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
            </Field>
          </div>

          <DialogFooter>
            {editTask && (canEditAll || editTask.createdBy.id === session?.user?.id) && (
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
                <Textarea
                  placeholder="Add a comment..."
                  {...commentForm.register("content")}
                  rows={2}
                  className="flex min-h-0 flex-1 resize-none"
                />
                <Button
                  onClick={commentForm.handleSubmit((data) => {
                    if (viewTask) {
                      createCommentMutation.mutate({
                        taskId: viewTask.id,
                        content: data.content.trim(),
                      })
                    }
                  })}
                  disabled={createCommentMutation.isPending}
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            {viewTask && (canEditAll || viewTask.createdBy.id === session?.user?.id) && (
              <Button
                variant="destructive"
                onClick={() => setConfirmDelete(viewTask)}
              >
                <Trash className="size-3.5" />
                Delete
              </Button>
            )}
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
              <TableHead>Created by</TableHead>
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
                const isAssignee = task.assignees.some(
                  (a) => a.memberId === currentMember?.id,
                )
                const canEdit =
                  canEditAll ||
                  task.createdById === session?.user?.id
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
                      <span className="text-xs text-muted-foreground">
                        {task.createdBy.name}
                      </span>
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
                  onClick={() => setPage(actualPage)}
                  className="min-w-7"
                >
                  {actualPage + 1}
                </Button>
              )
            })}
            <Button
              variant="outline"
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
