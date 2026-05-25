"use client"

import { useCallback, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Paperclip, Link as LinkIcon, X, Upload } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { useOrganization } from "@/lib/organization-context"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/trpc/client"

const itemSchema = z.object({
  title: z.string().min(1, "Title is required.").max(200),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required."),
  subcategoryId: z.string().min(1, "Subcategory is required."),
})

type ItemForm = z.infer<typeof itemSchema>
interface SelectedFile { file: File; name: string; uploading: boolean; url?: string; error?: string }
interface LinkEntry { url: string; title: string }

export default function TeamAddKnowledgePage() {
  const { companySlug } = useParams<{ companySlug: string }>()
  const router = useRouter()
  const { organization } = useOrganization()
  const { data: session } = authClient.useSession()
  const activeTeamId = session?.session?.activeTeamId
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: catData, isLoading: catLoading } = api.knowledgeBase.categoryList.useQuery(
    { organizationId: organization?.id ?? "", teamId: activeTeamId ?? "" },
    { enabled: !!organization && !!activeTeamId },
  )
  const createItem = api.knowledgeBase.itemCreate.useMutation()

  const form = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: { title: "", description: "", categoryId: "", subcategoryId: "" },
  })

  const [files, setFiles] = useState<SelectedFile[]>([])
  const [links, setLinks] = useState<LinkEntry[]>([{ url: "", title: "" }])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    setFiles((prev) => [...prev, ...selected.map((f) => ({ file: f, name: f.name, uploading: false }))])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  function removeFile(index: number) { setFiles((prev) => prev.filter((_, i) => i !== index)) }
  function addLink() { setLinks((prev) => [...prev, { url: "", title: "" }]) }
  function updateLink(index: number, field: keyof LinkEntry, value: string) { setLinks((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))) }
  function removeLink(index: number) { setLinks((prev) => prev.filter((_, i) => i !== index)) }

  async function onSubmit(data: ItemForm) {
    if (!organization || !activeTeamId) return
    setError(null); setSubmitting(true)
    try {
      setFiles((prev) => prev.map((f) => ({ ...f, uploading: true })))
      const uploaded = await Promise.all(
        files.map(async (f) => {
          if (f.url) return f
          const body = new FormData(); body.set("file", f.file); body.set("type", "knowledgebase")
          const res = await fetch("/api/knowledge/upload", { method: "POST", body })
          if (!res.ok) { const err = await res.json().catch(() => ({ error: "Upload failed" })); return { ...f, uploading: false, error: err.error } }
          const { url } = await res.json(); return { ...f, uploading: false, url }
        }),
      )
      setFiles(uploaded)
      if (uploaded.filter((f) => !f.url).length > 0) { setError("Failed to upload some files."); setSubmitting(false); return }
      const validLinks = links.filter((l) => l.url.trim())
      await createItem.mutateAsync({
        organizationId: organization.id, subcategoryId: data.subcategoryId, title: data.title,
        description: data.description || undefined, teamId: activeTeamId,
        attachments: uploaded.map((f) => ({ name: f.name, url: f.url!, type: f.file.type, size: f.file.size })),
        links: validLinks.map((l) => ({ url: l.url, title: l.title || l.url })),
      })
      router.push(`/${companySlug}/manage-team/knowledge-base`)
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to create knowledge item."); setSubmitting(false) }
  }

  const categories = catData?.categories ?? []

  if (catLoading) return <div className="flex flex-1 items-center justify-center p-6"><Skeleton className="size-8 rounded-full" /></div>

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-xl">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">Add Team Knowledge</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Add a new knowledge base entry for your team.</p>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <Field><FieldLabel>Title</FieldLabel><Input {...form.register("title")} maxLength={200} placeholder="Enter title" />
            {form.formState.errors.title && <FieldError>{form.formState.errors.title.message}</FieldError>}</Field>
          <Field><FieldLabel>Category</FieldLabel>
            <Select value={form.watch("categoryId")} onValueChange={(v) => { form.setValue("categoryId", v, { shouldValidate: true }); form.setValue("subcategoryId", "") }}>
              <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
              <SelectContent>{categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent>
            </Select>
            {form.formState.errors.categoryId && <FieldError>{form.formState.errors.categoryId.message}</FieldError>}</Field>
          <Field><FieldLabel>Subcategory</FieldLabel>
            <Select value={form.watch("subcategoryId")} onValueChange={(v) => form.setValue("subcategoryId", v, { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Select a category first" /></SelectTrigger>
              <SelectContent>{categories.find((c) => c.id === form.watch("categoryId"))?.subcategories.map((sub) => (<SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>))}</SelectContent>
            </Select>
            {form.formState.errors.subcategoryId && <FieldError>{form.formState.errors.subcategoryId.message}</FieldError>}</Field>
          <Field><FieldLabel>Description</FieldLabel><Textarea {...form.register("description")} rows={6} placeholder="Enter description (optional)" /></Field>
          <Field><FieldLabel>Attachments</FieldLabel>
            <div className="space-y-2">
              <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.docx,.xlsx,.xls,.csv,.txt" className="hidden" onChange={handleFileSelect} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Paperclip className="mr-1.5 size-3.5" />Choose Files</Button>
              {files.length > 0 && <div className="space-y-1">{files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 rounded-none border border-border px-3 py-1.5 text-xs">
                  {f.uploading ? <span className="size-3 animate-spin rounded-full border-2 border-foreground border-t-transparent" /> : <Paperclip className="size-3 shrink-0 text-muted-foreground" />}
                  <span className="flex-1 truncate">{f.name}</span>
                  {f.error && <span className="text-destructive">{f.error}</span>}
                  <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground"><X className="size-3" /></button>
                </div>
              ))}</div>}
            </div></Field>
          <Field><FieldLabel>Links</FieldLabel>
            <div className="space-y-2">{links.map((link, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1 space-y-1">
                  <Input placeholder="URL" value={link.url} onChange={(e) => updateLink(i, "url", e.target.value)} className="text-xs" />
                  <Input placeholder="Title (optional)" value={link.title} onChange={(e) => updateLink(i, "title", e.target.value)} className="text-xs" />
                </div>
                <button type="button" onClick={() => removeLink(i)} className="mt-1 text-muted-foreground hover:text-foreground" disabled={links.length === 1}><X className="size-3.5" /></button>
              </div>
            ))}
              <Button type="button" variant="ghost" size="sm" onClick={addLink}><LinkIcon className="mr-1.5 size-3.5" />Add Link</Button>
            </div></Field>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting}><Upload className="mr-1.5 size-3.5" />Submit</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
