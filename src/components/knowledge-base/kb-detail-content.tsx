"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Paperclip,
  Link as LinkIcon,
  CalendarDots,
  User,
  TrashSimple,
  PencilSimple,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { MarkdownRenderer } from "@/components/knowledge-base/markdown-renderer"
import { KbDetailShell } from "@/components/knowledge-base/kb-detail-shell"
import { KbCommentSection } from "@/components/knowledge-base/kb-comment-section"
import { KbEditHistorySection } from "@/components/knowledge-base/kb-edit-history"
import { KbEditSheet } from "@/components/knowledge-base/kb-edit-sheet"
import { api } from "@/lib/trpc/client"

interface KbDetailContentProps {
  slug: string
  baseUrl: string
}

export function KbDetailContent({ slug, baseUrl }: KbDetailContentProps) {
  const router = useRouter()
  const { data, isLoading } = api.knowledgeBase.itemGet.useQuery({ id: slug })
  const deleteItem = api.knowledgeBase.itemDelete.useMutation()
  const utils = api.useUtils()
  const [showDelete, setShowDelete] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-center py-20">
          <Skeleton className="size-8 rounded-full" />
        </div>
      </div>
    )
  }

  if (!data?.item) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <p className="text-xs text-muted-foreground">
            Knowledge item not found.
          </p>
          <Link href={`${baseUrl}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-1.5 size-3.5" />
              Back
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const item = data.item

  const content = (
    <div className="max-w-2xl">
      <Link
        href={`${baseUrl}`}
        className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3" />
        Back to Knowledge Base
      </Link>

      <div className="mb-2 text-xs text-muted-foreground">
        {item.subcategory.category.name} &rsaquo; {item.subcategory.name}
      </div>

      <h1 className="mb-3 text-xl font-semibold">{item.title}</h1>

      <div className="mb-6 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <User className="size-3.5" />
          <span>{item.author.name}</span>
          {item.author.email && (
            <span className="text-muted-foreground/60">
              ({item.author.email})
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarDots className="size-3.5" />
          {new Date(item.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {item.description && (
        <div className="mb-8">
          <MarkdownRenderer content={item.description} />
        </div>
      )}

      {item.attachments.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <Paperclip className="size-4" />
            Attachments ({item.attachments.length})
          </h2>
          <div className="space-y-1">
            {item.attachments.map((att) => (
              <a
                key={att.id}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-none border border-border px-3 py-2 text-xs transition-colors hover:bg-accent"
              >
                <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{att.name}</span>
                {att.size > 0 && (
                  <span className="tabular-nums text-muted-foreground">
                    {att.size > 1024 * 1024
                      ? `${(att.size / 1024 / 1024).toFixed(1)} MB`
                      : `${(att.size / 1024).toFixed(0)} KB`}
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {item.links.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <LinkIcon className="size-4" />
            Links ({item.links.length})
          </h2>
          <div className="space-y-1">
            {item.links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-none border border-border px-3 py-2 text-xs transition-colors hover:bg-accent"
              >
                <LinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">
                  {link.title || link.url}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 flex gap-2 border-t border-border pt-6">
        <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
          <PencilSimple className="mr-1.5 size-3.5" />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDelete(true)}
          disabled={deleteItem.isPending}
        >
          <TrashSimple className="mr-1.5 size-3.5" />
          Delete
        </Button>
      </div>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Knowledge</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{item.title}</strong>?
              This item will be moved to trash.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDelete(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={deleteItem.isPending}
              onClick={async () => {
                try {
                  await deleteItem.mutateAsync({ id: item.id })
                  utils.knowledgeBase.itemList.invalidate()
                  router.push(`${baseUrl}`)
                } catch {
                  setShowDelete(false)
                }
              }}
            >
              {deleteItem.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <KbEditSheet open={showEdit} onOpenChange={setShowEdit} item={item} />
    </div>
  )

  const sidebar = (
    <>
      <KbCommentSection kbItemId={item.id} />
      <KbEditHistorySection kbItemId={item.id} />
    </>
  )

  return <KbDetailShell content={content} sidebar={sidebar} />
}
