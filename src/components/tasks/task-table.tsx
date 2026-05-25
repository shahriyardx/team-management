"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PencilSimple, Plus, Trash } from "@phosphor-icons/react"

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
import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"
import { authClient } from "@/lib/auth-client"
import { KanbanBoard } from "./kanban/kanban-board"

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
  sortOrder: number
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  createdAt: string
  updatedAt: string
  teamId: string | null
  organizationId: string
  createdById: string
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

export function TaskTable({
  tasks,
  isLoading,
  listUtils,
  listInput,
  dashboard,
}: {
  tasks: Task[]
  isLoading: boolean
  listUtils: any
  listInput: any
  dashboard: "owner-dashboard" | "team-leader-dashboard" | "team-member-dashboard"
}) {
  const { session, organization } = useOrganization()

  const activeTeamId = session?.session?.activeTeamId
  const isTeamDashboard = dashboard !== "owner-dashboard"
  const utils = api.useUtils()

  // Refs to avoid stale closures in mutation callbacks
  const listUtilsRef = useRef(listUtils)
  listUtilsRef.current = listUtils
  const listInputRef = useRef<any>(listInput)
  listInputRef.current = listInput

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

  const currentMember = orgMembers.find((m) => m.userId === session?.user?.id)
  const canEditAll =
    currentMember?.role === "admin" || currentMember?.role === "owner"

  const { data: assignableData, isLoading: assignableLoading } =
    api.task.listOrgAssignableMembers.useQuery(undefined, {
      enabled: !!organization && !isTeamDashboard,
    })

  const { data: teamAssigneesData, isLoading: teamAssigneesLoading } =
    api.task.listTeamAssignableMember.useQuery(undefined, {
      enabled: !!organization && isTeamDashboard,
    })

  const assigneeMembers = isTeamDashboard
    ? (teamAssigneesData?.members ?? [])
    : (assignableData?.members ?? [])

  const membersLoading = isTeamDashboard
    ? teamAssigneesLoading
    : assignableLoading

  // Create/edit mutation
  const createMutation = api.task.create.useMutation({
    onSuccess: () => {
      listUtilsRef.current.invalidate(listInputRef.current)
      utils.task.getSidebarCounts.invalidate()
    },
  })
  const updateMutation = api.task.update.useMutation({
    onSuccess: () => {
      listUtilsRef.current.invalidate(listInputRef.current)
      utils.task.getSidebarCounts.invalidate()
    },
  })
  const deleteMutation = api.task.delete.useMutation({
    onSuccess: () => {
      listUtilsRef.current.invalidate(listInputRef.current)
      utils.task.getSidebarCounts.invalidate()
    },
  })
  const reorderMutation = api.task.reorder.useMutation({
    onMutate: async ({ items }) => {
      const lu = listUtilsRef.current
      const li = listInputRef.current
      await lu.cancel(li)
      const previousData = lu.getData(li)
      lu.setData(li, (old: any) => {
        if (!old) return old
        const sortMap = new Map(items.map((i) => [i.id, i.sortOrder]))
        const updated = old.tasks.map((t: any) => {
          const s = sortMap.get(t.id)
          return s !== undefined ? { ...t, sortOrder: s } : t
        })
        updated.sort((a: any, b: any) => a.sortOrder - b.sortOrder)
        return { ...old, tasks: updated }
      })
      return { previousData }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        const lu = listUtilsRef.current
        const li = listInputRef.current
        lu.setData(li, context.previousData)
      }
    },
    onSettled: () => {
      listUtilsRef.current.invalidate(listInputRef.current)
      utils.task.getSidebarCounts.invalidate()
    },
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

  const openCreate = useCallback(
    (defaultStatus?: string) => {
      setEditTask(null)
      form.reset({
        title: "",
        description: "",
        status: (defaultStatus as TaskForm["status"]) ?? "todo",
        priority: "medium",
        assigneeIds: [],
        dueDate: "",
      })
      setCreateOpen(true)
    },
    [form],
  )

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
        createMutation.mutate({
          ...input,
          organizationId: organization.id,
          teamId: dashboard === "owner-dashboard" ? undefined : (activeTeamId ?? undefined),
        })
      }
      setCreateOpen(false)
    },
    [editTask, organization, activeTeamId, createMutation, updateMutation],
  )

  const handleDelete = useCallback(
    (taskId: string) => {
      deleteMutation.mutate({ id: taskId })
    },
    [deleteMutation],
  )

  const changeStatusMutation = api.task.changeStatus.useMutation({
    onMutate: async ({ id, status, sortOrder }) => {
      const lu = listUtilsRef.current
      const li = listInputRef.current
      await lu.cancel(li)
      const previousData = lu.getData(li)
      lu.setData(li, (old: any) => {
        if (!old) return old
        const updated = old.tasks.map((t: any) =>
          t.id === id
            ? { ...t, status, ...(sortOrder !== undefined ? { sortOrder } : {}) }
            : t,
        )
        updated.sort((a: any, b: any) => a.sortOrder - b.sortOrder)
        return { ...old, tasks: updated }
      })
      return { previousData }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        const lu = listUtilsRef.current
        const li = listInputRef.current
        lu.setData(li, context.previousData)
      }
    },
    onSettled: () => {
      listUtilsRef.current.invalidate(listInputRef.current)
      utils.task.getSidebarCounts.invalidate()
    },
  })

  const handleStatusChange = useCallback(
    (taskId: string, status: string, sortOrder?: number) => {
      changeStatusMutation.mutate({
        id: taskId,
        status: status as "todo" | "in_progress" | "done",
        ...(sortOrder !== undefined ? { sortOrder } : {}),
      })
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
          <h1 className="text-lg font-semibold text-foreground">Tasks</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Drag and drop cards to update status or reorder
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => openCreate()}>
            <Plus className="size-3.5" />
            Add task
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        tasks={tasks}
        onStatusChange={handleStatusChange}
        onReorder={(items) => reorderMutation.mutate({ items })}
        onCardClick={(id) => {
          const task = tasks.find((t) => t.id === id)
          if (task) setViewTask(task)
        }}
        onAddClick={(status) => openCreate(status)}
      />

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
            {editTask &&
              (canEditAll || editTask.createdBy.id === session?.user?.id) && (
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
            {viewTask &&
              (canEditAll || viewTask.createdBy.id === session?.user?.id) && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      openEdit(viewTask)
                      setViewTask(null)
                    }}
                  >
                    <PencilSimple className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setConfirmDelete(viewTask)}
                  >
                    <Trash className="size-3.5" />
                    Delete
                  </Button>
                </>
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
    </div>
  )
}
