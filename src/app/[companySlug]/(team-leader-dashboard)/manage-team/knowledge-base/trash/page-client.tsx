"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  TrashSimple,
  CloudArrowUp,
  Paperclip,
  Link as LinkIcon,
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
import { useOrganization } from "@/lib/organization-context"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/trpc/client"

export default function TrashPage() {
  const { companySlug } = useParams<{ companySlug: string }>()
  const { organization } = useOrganization()
  const { data: session } = authClient.useSession()
  const activeTeamId = session?.session?.activeTeamId

  const { data, isLoading } = api.knowledgeBase.trashList.useQuery(
    { organizationId: organization?.id ?? "", teamId: activeTeamId ?? "" },
    { enabled: !!organization && !!activeTeamId },
  )
  const restoreItem = api.knowledgeBase.itemRestore.useMutation()
  const permanentDelete = api.knowledgeBase.itemPermanentDelete.useMutation()
  const utils = api.useUtils()

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const items = data?.items ?? []

  function handleRestore(id: string) {
    restoreItem.mutate(
      { id },
      {
        onSuccess: () => {
          utils.knowledgeBase.trashList.invalidate()
          utils.knowledgeBase.itemList.invalidate()
        },
      },
    )
  }

  function handlePermanentDelete(id: string) {
    permanentDelete.mutate(
      { id },
      {
        onSuccess: () => {
          utils.knowledgeBase.trashList.invalidate()
          utils.knowledgeBase.itemList.invalidate()
          setDeleteTarget(null)
        },
      },
    )
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <Link
            href={`/${companySlug}/manage-team/knowledge-base`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            Back to Knowledge Base
          </Link>
        </div>
        <h1 className="mt-4 text-lg font-semibold">Trash</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Deleted knowledge items can be restored or permanently removed.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-xs text-muted-foreground">Trash is empty.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-none border border-border px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {item.title}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>{item.author.name}</span>
                  {item._count.attachments > 0 && (
                    <span className="flex items-center gap-1">
                      <Paperclip className="size-2.5" />
                      {item._count.attachments}
                    </span>
                  )}
                  {item._count.links > 0 && (
                    <span className="flex items-center gap-1">
                      <LinkIcon className="size-2.5" />
                      {item._count.links}
                    </span>
                  )}
                  {item.subcategory.name && (
                    <span>
                      {item.subcategory.category.name} &rsaquo;{" "}
                      {item.subcategory.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(item.id)}
                  disabled={restoreItem.isPending}
                >
                  <CloudArrowUp className="mr-1 size-3.5" />
                  Restore
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteTarget(item.id)}
                  disabled={permanentDelete.isPending}
                >
                  <TrashSimple className="mr-1 size-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently Delete</DialogTitle>
            <DialogDescription>
              This will permanently delete this item and its files. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={permanentDelete.isPending}
              onClick={() =>
                deleteTarget && handlePermanentDelete(deleteTarget)
              }
            >
              {permanentDelete.isPending ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
