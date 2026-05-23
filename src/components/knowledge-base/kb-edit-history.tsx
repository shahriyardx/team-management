"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api } from "@/lib/trpc/client"

export function KbEditHistorySection({ kbItemId }: { kbItemId: string }) {
  const { data, isLoading } = api.knowledgeBase.editHistoryList.useQuery({ kbItemId })
  const history = data?.history ?? []

  if (isLoading) {
    return (
      <div>
        <h3 className="mb-3 text-sm font-semibold">Edit History</h3>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div>
        <h3 className="mb-3 text-sm font-semibold">Edit History</h3>
        <p className="text-xs text-muted-foreground">No edits recorded.</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">Edit History ({history.length})</h3>
      <div className="space-y-3">
        {history.map((entry) => {
          let changes: Record<string, { old: unknown; new: unknown }> = {}
          try { changes = JSON.parse(entry.changes) } catch {}

          const changeLabels = Object.keys(changes).map((key) => {
            if (key === "title") return "Title changed"
            if (key === "description") return "Description updated"
            return `${key} changed`
          })

          return (
            <div key={entry.id} className="flex gap-2.5 rounded-none border border-border px-3 py-2 text-xs">
              <Avatar className="mt-0.5 size-5 shrink-0 rounded-full">
                <AvatarImage src={entry.editor.image ?? undefined} />
                <AvatarFallback className="rounded-full text-[7px]">
                  {entry.editor.name?.charAt(0)?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <span className="font-medium text-foreground">{entry.editor.name}</span>
                <span className="ml-1 text-muted-foreground">
                  edited {formatRelativeTime(entry.editedAt)}
                </span>
                {changeLabels.length > 0 && (
                  <p className="mt-0.5 text-muted-foreground">{changeLabels.join(", ")}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function formatRelativeTime(date: Date | string): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
