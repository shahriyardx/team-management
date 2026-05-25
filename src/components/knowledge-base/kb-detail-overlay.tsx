"use client"

import { useState } from "react"
import {
  PencilSimple,
  TrashSimple,
  Paperclip,
  Link as LinkIcon,
  CalendarDots,
  User,
  XIcon,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { KbDetailShell } from "@/components/knowledge-base/kb-detail-shell"
import { KbCommentSection } from "@/components/knowledge-base/kb-comment-section"
import { KbEditHistorySection } from "@/components/knowledge-base/kb-edit-history"
import { KbEditSheet } from "@/components/knowledge-base/kb-edit-sheet"
import { MarkdownRenderer } from "@/components/knowledge-base/markdown-renderer"
import { api } from "@/lib/trpc/client"
import { useOrganization } from "@/lib/organization-context"

interface KbDetailOverlayProps {
  slug: string
  onClose: () => void
}

export function KbDetailOverlay({ slug, onClose }: KbDetailOverlayProps) {
  const { organization } = useOrganization()
  const { data, isLoading } = api.knowledgeBase.itemGet.useQuery({ id: slug })
  const deleteItem = api.knowledgeBase.itemDelete.useMutation()
  const utils = api.useUtils()
  const [showDelete, setShowDelete] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const item = data?.item
  const canEdit = data?.canEdit ?? false
  const canDelete = data?.canDelete ?? false

  const handleDelete = async () => {
    if (!data?.item) return
    try {
      await deleteItem.mutateAsync({ id: data.item.id })
      utils.knowledgeBase.itemList.invalidate()
      onClose()
    } catch {
      setShowDelete(false)
    }
  }

  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="fixed inset-0 z-50 flex flex-col max-w-none w-full h-full translate-x-0 translate-y-0 rounded-none border-0 bg-background p-0 shadow-none sm:max-w-none sm:w-full"
        >
          {/* Mobile header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
            <span className="text-sm font-medium truncate">
              {organization?.name ?? "Knowledge Base"}
            </span>
            <Button
              onClick={onClose}
              variant={"outline"}
              size={"icon-sm"}
              className="fixed top-4 right-4"
            >
              <XIcon />
            </Button>
          </div>
          {/* Desktop close button */}
          <Button
            onClick={onClose}
            variant={"outline"}
            size={"icon-sm"}
            className="fixed top-4 right-4"
          >
            <XIcon />
          </Button>
          <div className="flex-1 overflow-auto">
            <OverlayContent
              data={data}
              isLoading={isLoading}
              onClose={onClose}
            />
          </div>
          {item && (canEdit || canDelete) && (
            <DialogFooter className="border-t border-border px-6 py-4 sm:px-6">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEdit(true)}
                >
                  <PencilSimple className="mr-1.5 size-3.5" />
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDelete(true)}
                  disabled={deleteItem.isPending}
                >
                  <TrashSimple className="mr-1.5 size-3.5" />
                  Delete
                </Button>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Knowledge</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{data?.item?.title}</strong>? This item will be moved to
              trash.
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
              onClick={handleDelete}
            >
              {deleteItem.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit sheet */}
      {data?.item && (
        <KbEditSheet
          open={showEdit}
          onOpenChange={setShowEdit}
          item={data.item}
        />
      )}
    </>
  )
}

function OverlayContent({
  data,
  isLoading,
  onClose,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
  isLoading: boolean
  onClose: () => void
}) {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Skeleton className="size-8 rounded-full" />
      </div>
    )
  }

  if (!data?.item) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
        <p className="text-xs text-muted-foreground">
          Knowledge item not found.
        </p>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    )
  }

  return (
    <KbDetailShell
      content={<ItemContent item={data.item} />}
      sidebar={
        <>
          <KbCommentSection kbItemId={data.item.id} />
          <KbEditHistorySection kbItemId={data.item.id} />
        </>
      }
    />
  )
}

interface OverlayItem {
  id: string
  title: string
  description: string | null
  teamId: string | null
  createdAt: string
  author: { id: string; name: string | null; email: string | null }
  subcategory: { name: string; category: { name: string } }
  attachments: Array<{
    id: string
    name: string
    url: string
    type: string
    size: number
  }>
  links: Array<{ id: string; url: string; title: string }>
}

function ItemContent({ item }: { item: OverlayItem }) {
  return (
    <div className="max-w-2xl">
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
    </div>
  )
}
