"use client"

import { useCallback, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Paperclip, Link as LinkIcon, X } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { api } from "@/lib/trpc/client"

const itemSchema = z.object({
  title: z.string().min(1, "Title is required.").max(200),
  description: z.string().optional(),
})

type ItemForm = z.infer<typeof itemSchema>

interface SelectedFile {
  file?: File
  name: string
  url: string
  type: string
  size: number
  uploading: boolean
  error?: string
}

interface LinkEntry {
  url: string
  title: string
}

export function KbEditSheet({
  open,
  onOpenChange,
  item,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: {
    id: string
    title: string
    description?: string | null
    attachments: Array<{
      id: string
      name: string
      url: string
      type: string
      size: number
    }>
    links: Array<{ id: string; url: string; title: string }>
  }
}) {
  const updateItem = api.knowledgeBase.itemUpdate.useMutation()
  const utils = api.useUtils()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: { title: item.title, description: item.description ?? "" },
  })

  const [files, setFiles] = useState<SelectedFile[]>(
    item.attachments.map((a) => ({
      name: a.name,
      url: a.url,
      type: a.type,
      size: a.size,
      uploading: false,
    })),
  )
  const [links, setLinks] = useState<LinkEntry[]>(
    item.links.length > 0
      ? item.links.map((l) => ({ url: l.url, title: l.title }))
      : [{ url: "", title: "" }],
  )
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? [])
      setFiles((prev) => [
        ...prev,
        ...selected.map((f) => ({
          file: f,
          name: f.name,
          url: "",
          type: f.type,
          size: f.size,
          uploading: false,
        })),
      ])
      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    [],
  )

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }
  function addLink() {
    setLinks((prev) => [...prev, { url: "", title: "" }])
  }
  function updateLink(index: number, field: keyof LinkEntry, value: string) {
    setLinks((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    )
  }
  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(data: ItemForm) {
    setError(null)
    setSubmitting(true)

    try {
      setFiles((prev) => prev.map((f) => ({ ...f, uploading: true })))

      const uploaded = await Promise.all(
        files.map(async (f) => {
          if (f.url && !f.file)
            return { name: f.name, url: f.url, type: f.type, size: f.size }
          if (!f.file)
            return { name: f.name, url: f.url, type: f.type, size: f.size }
          const body = new FormData()
          body.set("file", f.file)
          body.set("type", "knowledgebase")
          const res = await fetch("/api/knowledge/upload", {
            method: "POST",
            body,
          })
          if (!res.ok) {
            const err = await res
              .json()
              .catch(() => ({ error: "Upload failed" }))
            throw new Error(err.error)
          }
          const { url } = await res.json()
          return { name: f.name, url, type: f.type, size: f.size }
        }),
      )

      const validLinks = links.filter((l) => l.url.trim())

      await updateItem.mutateAsync({
        id: item.id,
        title: data.title.trim(),
        description: data.description || undefined,
        attachments: uploaded,
        links: validLinks.map((l) => ({ url: l.url, title: l.title || l.url })),
      })

      utils.knowledgeBase.itemGet.invalidate({ id: item.id })
      utils.knowledgeBase.editHistoryList.invalidate({ kbItemId: item.id })
      setSubmitting(false)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update.")
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Edit Knowledge</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="mt-6 space-y-5 px-6 pb-6"
        >
          <Field>
            <FieldLabel>Title</FieldLabel>
            <Input
              {...form.register("title")}
              maxLength={200}
              placeholder="Enter title"
            />
            {form.formState.errors.title && (
              <FieldError>{form.formState.errors.title.message}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel>Description</FieldLabel>
            <Textarea
              {...form.register("description")}
              rows={6}
              placeholder="Enter description (optional)"
            />
          </Field>

          <Field>
            <FieldLabel>Attachments</FieldLabel>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.docx,.xlsx,.xls,.csv,.txt"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="mr-1.5 size-3.5" />
                Choose Files
              </Button>
              {files.length > 0 && (
                <div className="space-y-1">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-none border border-border px-3 py-1.5 text-xs"
                    >
                      {f.uploading && !f.url ? (
                        <span className="size-3 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                      ) : (
                        <Paperclip className="size-3 shrink-0 text-muted-foreground" />
                      )}
                      <span className="flex-1 truncate">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <Field>
            <FieldLabel>Links</FieldLabel>
            <div className="space-y-2">
              {links.map((link, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder="URL"
                      value={link.url}
                      onChange={(e) => updateLink(i, "url", e.target.value)}
                      className="text-xs"
                    />
                    <Input
                      placeholder="Title (optional)"
                      value={link.title}
                      onChange={(e) => updateLink(i, "title", e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLink(i)}
                    className="mt-1 text-muted-foreground hover:text-foreground"
                    disabled={links.length === 1}
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={addLink}>
                <LinkIcon className="mr-1.5 size-3.5" />
                Add Link
              </Button>
            </div>
          </Field>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
