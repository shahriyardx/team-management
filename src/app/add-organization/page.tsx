"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UploadSimple } from "@phosphor-icons/react"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"

const orgSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(48, "Name must be at most 48 characters."),
})

type OrgForm = z.infer<typeof orgSchema>

export default function AddOrganizationPage() {
  const router = useRouter()
  const { data: session, isPending: sessionLoading } = authClient.useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const form = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
    defaultValues: { name: "" },
  })

  useEffect(() => {
    if (sessionLoading) return
    if (!session) { router.replace("/"); return }
    // If user already has an org, redirect to dashboard
    authClient.organization.list().then((res) => {
      if (res.data && res.data.length > 0) {
        router.replace("/dashboard")
      }
    })
  }, [session, sessionLoading, router])

  const handleLogoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith("image/")) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const onSubmit = useCallback(
    async (data: OrgForm) => {
      try {
        const slug = data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

        let logo: string | undefined
        if (logoFile) {
          const body = new FormData()
          body.set("file", logoFile)
          const res = await fetch("/api/upload", { method: "POST", body })
          if (res.ok) {
            const json = await res.json()
            logo = json.url
          }
        }

        await authClient.organization.create({ name: data.name, slug, logo })
        router.replace("/dashboard")
      } catch {
        form.setError("name", { message: "Failed to create organization." })
      }
    },
    [form, router, logoFile],
  )

  const nameValue = form.watch("name")

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left: Setup illustration */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-950 via-zinc-900 to-zinc-950 px-8 py-12 sm:px-12 sm:py-16 lg:w-1/2 lg:px-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 size-96 rounded-full bg-indigo-500/5 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-white">
            P
          </div>
          <span className="text-sm font-semibold tracking-widest text-white">
            PULSE
          </span>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            Set up your workspace
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
            Name your organization and add a logo. You can invite your team and
            customize everything later.
          </p>

          <div className="space-y-4 pt-4">
            {[
              { step: "1", label: "Name & brand", done: !!nameValue },
              { step: "2", label: "Invite your team", done: false },
              { step: "3", label: "Start shipping", done: false },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-3">
                <div
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    s.done
                      ? "bg-indigo-500 text-white"
                      : "bg-white/10 text-zinc-400"
                  }`}
                >
                  {s.done ? "✓" : s.step}
                </div>
                <span
                  className={`text-sm ${
                    s.done ? "text-white" : "text-zinc-500"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-zinc-600">&copy; 2026 Team Pulse</p>
      </div>

      {/* Right: Form (no card) */}
      <div className="flex flex-1 items-center justify-center bg-background px-10 py-16 lg:w-1/2">
        <div className="w-full max-w-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Create your organization
          </h2>
          <p className="mb-8 mt-1 text-sm text-muted-foreground">
            Give your workspace a name and optionally add a logo.
          </p>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Logo dropzone */}
            <div>
              <label className="mb-2 block text-xs font-medium text-foreground">
                Logo
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoSelect}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="flex h-32 w-32 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-muted-foreground/40"
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="size-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                    <UploadSimple className="size-5" />
                    <span className="text-xs">Upload</span>
                  </div>
                )}
              </div>
            </div>

            {/* Name */}
            <Field>
              <FieldLabel htmlFor="name">Organization name</FieldLabel>
              <Input
                id="name"
                placeholder="Acme Corp"
                {...form.register("name")}
                aria-invalid={!!form.formState.errors.name}
                disabled={form.formState.isSubmitting}
                autoFocus
              />
              {form.formState.errors.name && (
                <FieldError errors={[form.formState.errors.name]} />
              )}
            </Field>

            {/* Slug preview */}
            {nameValue && (
              <div className="-mt-2">
                <span className="text-xs text-muted-foreground">
                  pulse.app/
                  <span className="text-foreground">
                    {nameValue.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}
                  </span>
                </span>
              </div>
            )}

            <Button
              type="submit"
              className="h-10 w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? "Creating..."
                : "Create organization"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
