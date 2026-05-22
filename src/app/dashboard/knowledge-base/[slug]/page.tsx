"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Paperclip, Link as LinkIcon, CalendarDots, User, TrashSimple } from "@phosphor-icons/react"
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
import { api } from "@/lib/trpc/client"

export default function KnowledgeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const { data, isLoading } = api.knowledgeBase.itemGet.useQuery({ id: slug })
  const deleteItem = api.knowledgeBase.itemDelete.useMutation()
  const utils = api.useUtils()
  const [showDelete, setShowDelete] = useState(false)

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Skeleton className="size-8 rounded-full" />
      </div>
    )
  }

  if (!data?.item) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
        <p className="text-xs text-muted-foreground">Knowledge item not found.</p>
        <Link href="/dashboard/knowledge-base">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1.5 size-3.5" />
            Back to Knowledge Base
          </Button>
        </Link>
      </div>
    )
  }

  const item = data.item

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl">
        {/* Back link */}
        <Link
          href="/dashboard/knowledge-base"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="size-3" />
          Back to Knowledge Base
        </Link>

        {/* Breadcrumb */}
        <div className="text-xs text-muted-foreground mb-2">
          {item.subcategory.category.name} &rsaquo; {item.subcategory.name}
        </div>

        {/* Title */}
        <h1 className="text-xl font-semibold mb-3">{item.title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
          <div className="flex items-center gap-1.5">
            <User className="size-3.5" />
            <span>{item.author.name}</span>
            {item.author.email && <span className="text-muted-foreground/60">({item.author.email})</span>}
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

        {/* Description */}
        {item.description && (
          <div className="mb-8">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.description}</p>
          </div>
        )}

        {/* Attachments */}
        {item.attachments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
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
                  className="flex items-center gap-3 rounded-none border border-border px-3 py-2 text-xs hover:bg-accent transition-colors"
                >
                  <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{att.name}</span>
                  {att.size > 0 && (
                    <span className="text-muted-foreground tabular-nums">
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

        {/* Links */}
        {item.links.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
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
                  className="flex items-center gap-3 rounded-none border border-border px-3 py-2 text-xs hover:bg-accent transition-colors"
                >
                  <LinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{link.title || link.url}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Delete */}
        <div className="mt-10 pt-6 border-t border-border">
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

        {/* Delete confirmation */}
        <Dialog open={showDelete} onOpenChange={setShowDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Knowledge</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{item.title}</strong>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowDelete(false)}>
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
                    router.push("/dashboard/knowledge-base")
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
      </div>
    </div>
  )
}
