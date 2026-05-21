"use client"

import { useCallback, useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  DotsThreeVertical,
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

export function TaskTable({ mode }: { mode: "mine" | "all" }) {
  const { session, organization } = useOrganization()

  const { data, isLoading } = api.task.list.useQuery(
    { organizationId: organization?.id ?? "" },
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
              <div>
                <Label className="mb-2 block">Status</Label>
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9 w-full rounded-none text-xs">
                        {field.value
                          ? statusLabels[field.value]
                          : "Select status"}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">Todo</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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
          </div>

          <DialogFooter>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTask(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-none border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assignee</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleTasks.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-16 text-center text-muted-foreground"
                >
                  {mode === "all" ? "No tasks yet." : "No assigned tasks."}
                </TableCell>
              </TableRow>
            ) : (
              visibleTasks.map((task) => {
                const canEdit =
                  mode === "all"
                    ? canEditAll
                    : canEditAll || task.createdById === session?.user?.id
                const isAssignee = task.assignees.some(
                  (a) => a.memberId === currentMember?.id,
                )
                const canChangeStatus = canEditAll || isAssignee
                const clickable = canEdit || isAssignee

                return (
                  <TableRow
                    key={task.id}
                    className={clickable ? "cursor-pointer" : ""}
                    onClick={() => {
                      if (canEdit) openEdit(task)
                      else if (isAssignee) setViewTask(task)
                    }}
                  >
                    <TableCell>
                      <span
                        className={`truncate ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}
                      >
                        {task.title}
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
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
