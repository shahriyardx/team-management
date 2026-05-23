"use client"

import { useState } from "react"
import { TrashSimple } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useMemberRole } from "@/lib/use-member-role"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/trpc/client"

export function KbCommentSection({ kbItemId }: { kbItemId: string }) {
  const { data: session } = authClient.useSession()
  const currentUserId = session?.user?.id
  const { role } = useMemberRole()
  const utils = api.useUtils()
  const isPrivileged = role === "owner" || role === "admin" || role === "team_leader"

  const { data, isLoading } = api.knowledgeBase.commentList.useQuery({ kbItemId })
  const createComment = api.knowledgeBase.commentCreate.useMutation()
  const deleteComment = api.knowledgeBase.commentDelete.useMutation()

  const [content, setContent] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const comments = data?.comments ?? []

  async function handleSubmit() {
    if (!content.trim()) return
    try {
      await createComment.mutateAsync({ kbItemId, content: content.trim() })
      setContent("")
      utils.knowledgeBase.commentList.invalidate({ kbItemId })
    } catch {}
  }

  async function handleDelete(id: string) {
    try {
      await deleteComment.mutateAsync({ id })
      utils.knowledgeBase.commentList.invalidate({ kbItemId })
      setDeleteTarget(null)
    } catch {}
  }

  function canDelete(authorId: string) {
    return authorId === currentUserId || isPrivileged
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">Comments ({comments.length})</h3>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : comments.length > 0 ? (
        <div className="mb-4 max-h-96 space-y-3 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5 rounded-none border border-border px-3 py-2 text-xs">
              <Avatar className="mt-0.5 size-5 shrink-0 rounded-full">
                <AvatarImage src={c.author.image ?? undefined} />
                <AvatarFallback className="rounded-full text-[7px]">
                  {c.author.name?.charAt(0)?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{c.author.name}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {formatRelativeTime(c.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-muted-foreground">{c.content}</p>
                {canDelete(c.authorId) && (
                  <button
                    onClick={() => setDeleteTarget(c.id)}
                    className="mt-1 flex items-center gap-0.5 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <TrashSimple className="size-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-4 text-xs text-muted-foreground">No comments yet.</p>
      )}

      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="text-xs"
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim() || createComment.isPending}
        >
          {createComment.isPending ? "Posting..." : "Post Comment"}
        </Button>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>Are you sure you want to delete this comment? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={deleteComment.isPending}
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              {deleteComment.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatRelativeTime(date: Date | string): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
