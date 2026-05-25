"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Plus, X, File, FileImage, FilePdf, FileDoc, FileXls, FileCsv, FilePpt, FileText, FileCode, FileMd, FileArchive } from "@phosphor-icons/react"
import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { FileDropzone } from "@/components/file-dropzone"

const FILE_ICONS: Record<string, typeof File> = {
  "image/": FileImage,
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
  return File
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required."),
  content: z.string().min(1, "Content is required."),
  teamId: z.string().optional(),
  pinned: z.boolean(),
  enableComments: z.boolean(),
  enableLikes: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface Props {
  announcementId?: string
}

export function AnnouncementForm({ announcementId }: Props) {
  const { organization } = useOrganization()
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const slug = params.companySlug as string
  const utils = api.useUtils()
  const { data: sessionData } = authClient.useSession()
  const isManageTeam = pathname.includes("/manage-team/")
  const activeTeamId = sessionData?.session?.activeTeamId ?? null
  const isEdit = !!announcementId

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      teamId: undefined,
      pinned: false,
      enableComments: true,
      enableLikes: true,
    },
  })

  const [links, setLinks] = useState<Array<{ url: string; title: string }>>([])
  const [newLinkUrl, setNewLinkUrl] = useState("")
  const [newLinkTitle, setNewLinkTitle] = useState("")
  const [thumbnailFile, setThumbnailFile] = useState<
    Array<{ name: string; url?: string; uploading?: boolean; error?: string; id?: string }>
  >([])
  const [selectedFiles, setSelectedFiles] = useState<
    Array<{
      file: File
      name: string
      uploading: boolean
      url?: string
      error?: string
    }>
  >([])
  const [existingAttachments, setExistingAttachments] = useState<
    Array<{ id: string; name: string; url: string; type: string; size: number }>
  >([])
  const [uploadError, setUploadError] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isThumbnailUploading, setIsThumbnailUploading] = useState(false)
  const thumbnailFileRef = useRef<File | null>(null)
  const thumbnailBlobUrlRef = useRef<string | null>(null)
  // Fetch existing announcement for edit mode
  const { data: existingData } = api.announcement.getById.useQuery(
    { id: announcementId ?? "", organizationId: organization?.id ?? "" },
    { enabled: isEdit && !!organization && !!announcementId },
  )

  // Populate form with existing data
  useEffect(() => {
    if (!existingData?.announcement) return
    const a = existingData.announcement
    form.reset({
      title: a.title,
      content: a.content,
      teamId: a.teamId ?? undefined,
      pinned: a.pinned,
      enableComments: a.enableComments,
      enableLikes: a.enableLikes,
    })
    const thumb = a.attachments?.find((att: { isThumbnail?: boolean }) => att.isThumbnail)
    if (thumb) {
      setThumbnailFile([{ name: "Thumbnail", url: thumb.url }])
    }
    if (a.links?.length) {
      const existing = a.links.map((l: { url: string; title: string }) => ({ url: l.url, title: l.title }))
      setLinks(existing)
    }
    if (a.attachments?.length) {
      setExistingAttachments(a.attachments)
    }
  }, [existingData, form])

  const { data: teamsData } = api.team.list.useQuery(
    { organizationId: organization?.id ?? "" },
    { enabled: !!organization },
  )
  const teams = (teamsData?.teams ?? []) as Array<{ id: string; name: string }>

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => {
      if (thumbnailBlobUrlRef.current) {
        URL.revokeObjectURL(thumbnailBlobUrlRef.current)
      }
    }
  }, [])

  const basePath = pathname.replace(/\/create\/?$/, "").replace(/\/edit\/?$/, "")
  const createMutation = api.announcement.create.useMutation({
    onSuccess: (res) => {
      utils.announcement.list.invalidate()
      router.push(`${basePath}/${res.announcement.id}`)
    },
  })
  const updateMutation = api.announcement.update.useMutation({
    onSuccess: () => {
      utils.announcement.list.invalidate()
      utils.announcement.getById.invalidate()
      router.back()
    },
  })
  const deleteAttachmentMutation = api.announcement.deleteAttachment.useMutation()

  const uploadFile = async (file: File): Promise<string> => {
    const body = new FormData()
    body.set("file", file)
    body.set("type", "announcements")
    const res = await fetch("/api/knowledge/upload", { method: "POST", body })
    if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed")
    const { url } = await res.json()
    return url
  }

  const onThumbnailDrop = useCallback(
    (files: File[]) => {
      const file = files[0]
      if (!file) return
      // Revoke previous blob URL
      if (thumbnailBlobUrlRef.current) {
        URL.revokeObjectURL(thumbnailBlobUrlRef.current)
      }
      const blobUrl = URL.createObjectURL(file)
      thumbnailBlobUrlRef.current = blobUrl
      thumbnailFileRef.current = file
      setThumbnailFile([{ name: file.name, url: blobUrl }])
    },
    [form],
  )

  const onAttachmentsDrop = useCallback((files: File[]) => {
    setSelectedFiles((prev) => [
      ...prev,
      ...files.map((f) => ({ file: f, name: f.name, uploading: false })),
    ])
  }, [])

  const removeAttachment = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const addLink = () => {
    if (!newLinkUrl.trim()) return
    setLinks([...links, { url: newLinkUrl.trim(), title: newLinkTitle.trim() || newLinkUrl.trim() }])
    setNewLinkUrl("")
    setNewLinkTitle("")
  }

  const onSubmit = async (values: FormValues) => {
    setIsUploading(true)
    setUploadError("")

    // Collect all files to upload (regular attachments + optional thumbnail)
    const filesToUpload: Array<{ file: File; isThumbnail: boolean }> = [
      ...selectedFiles.map((f) => ({ file: f.file, isThumbnail: false })),
    ]
    if (thumbnailFileRef.current) {
      filesToUpload.push({ file: thumbnailFileRef.current, isThumbnail: true })
    }

    let attachments: Array<{ name: string; url: string; type: string; size: number; isThumbnail?: boolean }> | undefined

    if (filesToUpload.length > 0) {
      // Show uploading state for selected files
      if (selectedFiles.length > 0) {
        setSelectedFiles(selectedFiles.map((f) => ({ ...f, uploading: true })))
      }
      if (thumbnailFileRef.current) {
        setIsThumbnailUploading(true)
      }

      const results = await Promise.all(
        filesToUpload.map(async ({ file, isThumbnail }) => {
          try {
            const url = await uploadFile(file)
            return { file, url, isThumbnail, error: undefined }
          } catch (e) {
            return { file, url: "", isThumbnail, error: (e as Error).message }
          }
        }),
      )

      const failed = results.find((r) => r.error)
      if (failed) {
        // Separate error reporting for thumbnail vs attachment
        if (failed.isThumbnail) {
          setUploadError("Failed to upload thumbnail")
        } else {
          const failedFile = selectedFiles.find((sf) => sf.file === failed.file)
          setUploadError(`Failed to upload: ${failedFile?.name ?? "file"}`)
        }
        setIsUploading(false)
        setIsThumbnailUploading(false)
        return
      }

      // Update local state with results
      const attachmentResults = results.filter((r) => !r.isThumbnail)
      const thumbResult = results.find((r) => r.isThumbnail)

      setSelectedFiles(
        attachmentResults.map((r) => {
          const orig = selectedFiles.find((sf) => sf.file === r.file)!
          return { ...orig, url: r.url, uploading: false, error: undefined }
        }),
      )

      if (thumbResult) {
        thumbnailFileRef.current = null
        setThumbnailFile([{ name: "Thumbnail", url: thumbResult.url }])
      }

      attachments = results.map((r) => ({
        name: r.file.name,
        url: r.url!,
        type: r.file.type,
        size: r.file.size,
        isThumbnail: r.isThumbnail,
      }))
    }

    setIsUploading(false)
    setIsThumbnailUploading(false)

    if (isEdit && announcementId) {
      updateMutation.mutate({
        id: announcementId,
        organizationId: organization?.id ?? "",
        title: values.title.trim(),
        content: values.content.trim(),
        pinned: values.pinned,
        enableComments: values.enableComments,
        enableLikes: values.enableLikes,
        links: links.length > 0 ? links : [],
        attachments,
      })
    } else {
      createMutation.mutate({
        title: values.title.trim(),
        content: values.content.trim(),
        organizationId: organization?.id ?? "",
        teamId: isManageTeam
          ? (activeTeamId ?? undefined)
          : values.teamId || undefined,
        pinned: values.pinned,
        enableComments: values.enableComments,
        enableLikes: values.enableLikes,
        links: links.length > 0 ? links : undefined,
        attachments,
      })
    }
  }

  const busy =
    isUploading ||
    isThumbnailUploading ||
    createMutation.isPending ||
    updateMutation.isPending

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3" />
        Back
      </button>

      <h1 className="text-base font-semibold">
        {isEdit ? "Edit Announcement" : "New Announcement"}
      </h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Field>
          <FieldLabel>Thumbnail</FieldLabel>
          <FileDropzone
            onDrop={onThumbnailDrop}
            onRemove={() => {
              if (thumbnailBlobUrlRef.current) {
                URL.revokeObjectURL(thumbnailBlobUrlRef.current)
                thumbnailBlobUrlRef.current = null
              }
              thumbnailFileRef.current = null
              setThumbnailFile([])
            }}
            files={thumbnailFile}
            accept={{ "image/*": [] }}
            multiple={false}
            preview
          />
        </Field>

        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Title</FieldLabel>
              <Input {...field} placeholder="Announcement title" />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="content"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Content (markdown supported)</FieldLabel>
              <Textarea {...field} placeholder="Write your announcement..." rows={12} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        {!isManageTeam && !isEdit && (
          <Controller
            control={form.control}
            name="teamId"
            render={({ field }) => (
              <Field>
                <FieldLabel>Scope</FieldLabel>
                <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v || undefined)}>
                  <SelectTrigger className="h-8 w-full rounded-none text-xs">
                    <SelectValue placeholder="Org-wide" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
        )}

        {/* Links */}
        <Field>
          <FieldLabel>Links (optional)</FieldLabel>
          <div className="flex gap-2">
            <Input
              value={newLinkTitle}
              onChange={(e) => setNewLinkTitle(e.target.value)}
              placeholder="Link title"
              className="h-8 text-xs rounded-none flex-1"
            />
            <Input
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              placeholder="URL"
              className="h-8 text-xs rounded-none flex-1"
            />
            <Button size="icon" variant="outline" onClick={addLink} type="button">
              <Plus className="size-3" />
            </Button>
          </div>
          {links.length > 0 && (
            <div className="mt-2 space-y-1">
              {links.map((link, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <span>{link.title}</span>
                  <span className="text-muted-foreground/50">&rarr;</span>
                  <span className="truncate">{link.url}</span>
                  <button
                    type="button"
                    onClick={() => setLinks(links.filter((_, j) => j !== i))}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Field>

        {/* Attachments */}
        <Field>
          <FieldLabel>Attachments (optional)</FieldLabel>

          {/* Existing attachments (edit mode) */}
          {isEdit && existingAttachments.length > 0 && (
            <div className="mb-3 space-y-1">
              <p className="text-[11px] text-muted-foreground">Existing attachments</p>
              {existingAttachments.map((att) => {
                const Icon = getFileIcon(att.type)
                return (
                  <div
                    key={att.id}
                    className="flex items-center gap-3 border border-border px-3 py-2.5"
                  >
                    <Icon className="size-5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{att.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatSize(att.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        deleteAttachmentMutation.mutate(
                          { id: att.id, organizationId: organization?.id ?? "" },
                          {
                            onSuccess: () =>
                              setExistingAttachments((prev) =>
                                prev.filter((a) => a.id !== att.id),
                              ),
                          },
                        )
                      }}
                      className="text-muted-foreground/50 hover:text-red-500 transition-colors shrink-0"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <FileDropzone
            onDrop={onAttachmentsDrop}
            onRemove={removeAttachment}
            files={selectedFiles}
            accept={{
              "image/*": [],
              "application/pdf": [],
              "application/msword": [],
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
              "application/vnd.ms-excel": [],
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [],
              "application/vnd.ms-powerpoint": [],
              "application/vnd.openxmlformats-officedocument.presentationml.presentation": [],
              "text/plain": [],
              "text/csv": [],
              "text/markdown": [],
              "application/rtf": [],
              "application/json": [],
            }}
            multiple
          />
          {uploadError && (
            <p className="text-xs text-red-500 mt-1">{uploadError}</p>
          )}
        </Field>

        <div className="flex flex-wrap items-center gap-6">
          <Controller
            control={form.control}
            name="pinned"
            render={({ field }) => (
              <Label className="cursor-pointer">
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                Pinned
              </Label>
            )}
          />
          <Controller
            control={form.control}
            name="enableComments"
            render={({ field }) => (
              <Label className="cursor-pointer">
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                Enable comments
              </Label>
            )}
          />
          <Controller
            control={form.control}
            name="enableLikes"
            render={({ field }) => (
              <Label className="cursor-pointer">
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                Enable likes
              </Label>
            )}
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving..." : isEdit ? "Update" : "Publish"}
          </Button>
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
