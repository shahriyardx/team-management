"use client"

import { useState } from "react"
import { format } from "date-fns"
import { useRouter, usePathname } from "next/navigation"
import { ArrowLeft, Heart, PencilSimple, Trash, FileImage as FileImageIcon, FilePdf, FileDoc, FileXls, FileCsv, FilePpt, FileText, FileCode, FileMd, FileArchive } from "@phosphor-icons/react"
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

const FILE_ICONS: Record<string, typeof FileImageIcon> = {
  "image/": FileImageIcon,
  "application/pdf": FilePdf,
  "application/msword": FileDoc,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": FileDoc,
  "application/vnd.ms-excel": FileXls,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": FileXls,
  "application/vnd.ms-powerpoint": FilePpt,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": FilePpt,
  "text/csv": FileCsv,
  "text/plain": FileText,
  "text/markdown": FileMd,
  "application/json": FileCode,
  "application/rtf": FileText,
  "application/zip": FileArchive,
  "application/x-rar-compressed": FileArchive,
  "application/x-7z-compressed": FileArchive,
}

function getFileIcon(type: string) {
  for (const [prefix, Icon] of Object.entries(FILE_ICONS)) {
    if (type.startsWith(prefix)) return Icon
  }
  return FileImageIcon
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

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
        {(() => {
          const thumb = announcement.attachments.find((a) => a.type?.startsWith("image/"))
          return thumb ? (
            <img
              src={thumb.url}
              alt=""
              className="w-full aspect-video object-cover mb-4"
            />
          ) : null
        })()}
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

      {announcement.attachments.some((a) => !a.isThumbnail) && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Attachments</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {announcement.attachments.filter((a) => !a.isThumbnail).map((att) => {
              const isImage = att.type?.startsWith("image/")
              const Icon = getFileIcon(att.type)
              return (
                <button
                  key={att.id}
                  type="button"
                  onClick={() => {
                    if (isImage) setLightboxUrl(att.url)
                    else window.open(att.url, "_blank", "noopener,noreferrer")
                  }}
                  className="flex items-center gap-3 border border-border px-3 py-2.5 text-xs text-left text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Icon className="size-5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{att.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatSize(att.size)}</p>
                  </div>
                </button>
              )
            })}
          </div>
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
            announcementAuthorId={announcement.authorId}
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

      {/* Image lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={(o) => { if (!o) setLightboxUrl(null) }}>
        <DialogContent className="max-w-4xl p-1 bg-black/90 border-none">
          {lightboxUrl && (
            <img
              src={lightboxUrl}
              alt=""
              className="max-h-[85vh] w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
