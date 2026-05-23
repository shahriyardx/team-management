"use client"

import { useState } from "react"
import { format } from "date-fns"
import { useRouter, usePathname } from "next/navigation"
import { ArrowLeft, Heart, PencilSimple, Trash } from "@phosphor-icons/react"
import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"
import { authClient } from "@/lib/auth-client"
import { useMemberRole } from "@/lib/use-member-role"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AnnouncementComments } from "./announcement-comments"
import { MarkdownRenderer } from "@/components/knowledge-base/markdown-renderer"
import type { AnnouncementDetail as AnnouncementDetailType } from "./types"

interface Props {
  announcementId: string
}

export function AnnouncementDetail({ announcementId }: Props) {
  const { organization } = useOrganization()
  const router = useRouter()
  const pathname = usePathname()
  const utils = api.useUtils()
  const { data: sessionData } = authClient.useSession()
  const { role } = useMemberRole()
  const isOrgAdmin = role === "owner" || role === "admin"

  const { data, isLoading } = api.announcement.getById.useQuery(
    { id: announcementId, organizationId: organization?.id ?? "" },
    { enabled: !!organization },
  )
  const announcement = data?.announcement as AnnouncementDetailType | undefined

  const deleteMutation = api.announcement.delete.useMutation({
    onSuccess: () => {
      utils.announcement.list.invalidate()
      router.back()
    },
  })

  const likeMutation = api.announcement.likeToggle.useMutation({
    onSuccess: () => {
      utils.announcement.getById.invalidate()
      utils.announcement.list.invalidate()
    },
  })

  const [deleteOpen, setDeleteOpen] = useState(false)

  const userId = sessionData?.user?.id
  const isAuthor = announcement?.authorId === userId
  const canModify = isOrgAdmin || isAuthor

  // Derive edit URL from current pathname
  const detailBase = pathname.replace(/\/+$/, "")
  const editUrl = `${detailBase}/edit`

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  if (!announcement) {
    return (
      <div className="p-6 text-center text-xs text-muted-foreground">
        Announcement not found.
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3" />
        Back
      </button>

      <div>
        {announcement.thumbnail && (
          <img
            src={announcement.thumbnail}
            alt=""
            className="w-full aspect-video object-cover mb-4"
          />
        )}
        <div className="flex items-center gap-2">
          {announcement.pinned && (
            <Badge variant="outline" className="text-[10px]">Pinned</Badge>
          )}
          {announcement.team && (
            <Badge variant="outline" className="text-[10px]">{announcement.team.name}</Badge>
          )}
        </div>
        <h1 className="text-lg font-semibold mt-2">{announcement.title}</h1>
        <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
          <span>{announcement.author.name}</span>
          <span>&middot;</span>
          <span>{format(new Date(announcement.createdAt), "MMMM d, yyyy")}</span>
        </div>
      </div>

      <div className="mb-8">
        <MarkdownRenderer content={announcement.content} />
      </div>

      {announcement.links.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Links</p>
          {announcement.links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-blue-600 hover:underline"
            >
              {link.title}
            </a>
          ))}
        </div>
      )}

      {announcement.attachments.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Attachments</p>
          {announcement.attachments.map((att) => (
            <div key={att.id} className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">{att.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-border pt-4">
        {announcement.enableLikes && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => likeMutation.mutate({ announcementId: announcement.id, organizationId: organization?.id ?? "" })}
            className={announcement.liked ? "text-red-500 border-red-500/30" : ""}
          >
            <Heart className="mr-1 size-3.5" weight={announcement.liked ? "fill" : "regular"} />
            {announcement._count.likes}
          </Button>
        )}
        {canModify && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(editUrl)}
            >
              <PencilSimple className="mr-1 size-3.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash className="mr-1 size-3.5" />
              Delete
            </Button>
          </>
        )}
      </div>

      {announcement.enableComments && (
        <div className="border-t border-border pt-4">
          <AnnouncementComments
            announcementId={announcement.id}
            comments={announcement.comments}
            organizationId={announcement.organizationId}
          />
        </div>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete announcement?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate({ id: announcement.id, organizationId: organization?.id ?? "" })}
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
