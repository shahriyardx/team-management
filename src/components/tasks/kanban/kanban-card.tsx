"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { CalendarDots, User } from "@phosphor-icons/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Task } from "./types"

const priorityColors: Record<string, string> = {
  urgent: "bg-red-500/10 text-red-600",
  high: "bg-orange-500/10 text-orange-600",
  medium: "bg-blue-500/10 text-blue-600",
  low: "bg-gray-500/10 text-gray-600",
}

interface Props {
  task: Task
  onClick?: () => void
}

export function KanbanCard({ task, onClick }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      onClick={onClick}
      className={`cursor-grab rounded-none border border-border bg-card px-3 py-2.5 text-xs transition-shadow hover:shadow-sm ${
        isDragging ? "z-50 shadow-lg opacity-50" : "active:cursor-grabbing"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className="font-medium line-clamp-2">{task.title}</span>
          {task.description && (
            <p className="mt-1 text-[11px] text-muted-foreground line-clamp-3">
              {task.description}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-none px-1.5 py-0.5 text-[10px] uppercase leading-tight ${
            priorityColors[task.priority] ?? ""
          }`}
        >
          {task.priority}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5 min-w-0">
          {task.dueDate && (
            <span className="flex items-center gap-1 truncate">
              <CalendarDots className="size-3 shrink-0" />
              {new Date(task.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
          {task.dueDate && <span className="text-border">|</span>}
          <span className="truncate">{task.createdBy.name}</span>
        </div>
        {task.assignees.length > 0 && (
          <div className="flex -space-x-1">
            {task.assignees.slice(0, 3).map((a) => (
              <Avatar
                key={a.memberId}
                className="size-5 border border-background"
              >
                <AvatarImage src={a.member.user.image ?? undefined} />
                <AvatarFallback className="text-[8px]">
                  {a.member.user.name?.charAt(0)?.toUpperCase() ?? (
                    <User className="size-2.5" />
                  )}
                </AvatarFallback>
              </Avatar>
            ))}
            {task.assignees.length > 3 && (
              <span className="flex size-5 items-center justify-center rounded-full border border-background bg-muted text-[8px] text-muted-foreground">
                +{task.assignees.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
