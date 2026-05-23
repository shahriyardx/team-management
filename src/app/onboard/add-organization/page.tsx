"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, UploadSimple, X } from "@phosphor-icons/react"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { authClient } from "@/lib/auth-client"

const TEAM_SIZES = ["1-10", "11-50", "51-200", "200+"] as const

const orgSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(48, "Name must be at most 48 characters."),
  websiteUrl: z.string().url("Enter a valid URL.").optional().or(z.literal("")),
  department: z.string().optional(),
  teamSize: z.string().optional(),
  acceptTerms: z.boolean().refine((v) => v === true, "You must accept the terms and policies."),
})

type OrgForm = z.infer<typeof orgSchema>

function generateSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

export default function AddOrganizationPage() {
  const router = useRouter()
  const { data: session, isPending: sessionLoading } = authClient.useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const [slug, setSlug] = useState("")
  const [manualSlug, setManualSlug] = useState(false)
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")
  const checkTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const form = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
    defaultValues: { name: "" },
  })

  useEffect(() => {
    if (sessionLoading) return
    if (!session) { router.replace("/"); return }
  }, [session, sessionLoading, router])

  const nameValue = form.watch("name")

  // Auto-generate slug from name unless user manually edited
  useEffect(() => {
    if (manualSlug) return
    setSlug(generateSlug(nameValue || ""))
  }, [nameValue, manualSlug])

  // Debounced slug check
  useEffect(() => {
    if (!slug || slug.length < 2) {
      setSlugStatus("idle")
      return
    }
    setSlugStatus("checking")
    clearTimeout(checkTimer.current)
    checkTimer.current = setTimeout(async () => {
      const { error } = await authClient.organization.checkSlug({ slug })
      setSlugStatus(error ? "taken" : "available")
    }, 500)
    return () => clearTimeout(checkTimer.current)
  }, [slug])

  const handleSlugEdit = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
    setSlug(val)
    setManualSlug(true)
  }, [])

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (!val) setManualSlug(false)
  }, [])

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
      if (slugStatus !== "available" && slugStatus !== "idle") return
      try {
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

        const { data: org } = await authClient.organization.create({
          name: data.name,
          slug,
          logo,
          websiteUrl: data.websiteUrl || undefined,
          department: data.department || undefined,
          teamSize: data.teamSize || undefined,
        } as any)
        if (org) {
          await authClient.organization.setActive({ organizationId: org.id })
          router.replace(`/${org.slug}`)
        } else {
          router.replace("/onboard")
        }
      } catch {
        form.setError("name", { message: "Failed to create organization." })
      }
    },
    [form, router, logoFile, slug, slugStatus],
  )

  const hostname = typeof window !== "undefined" ? window.location.hostname : "teams.weirdsoft.co.uk"

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
            W
          </div>
          <span className="text-sm font-semibold tracking-widest text-white">
            WEIRDTEAMS
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

        <p className="relative text-xs text-zinc-600">&copy; 2026 WeirdTeams</p>
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
                {...form.register("name", { onChange: handleNameChange })}
                aria-invalid={!!form.formState.errors.name}
                disabled={form.formState.isSubmitting}
                autoFocus
              />
              {form.formState.errors.name && (
                <FieldError errors={[form.formState.errors.name]} />
              )}
            </Field>

            {/* Editable slug preview */}
            {nameValue && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-foreground">
                  Workspace URL
                </label>
                <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
                  <span className="text-muted-foreground shrink-0">{hostname}/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={handleSlugEdit}
                    disabled={form.formState.isSubmitting}
                    className="min-w-0 flex-1 bg-transparent text-foreground outline-none"
                  />
                  {slugStatus === "checking" && (
                    <span className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                  )}
                  {slugStatus === "available" && (
                    <Check className="size-3.5 shrink-0 text-green-500" />
                  )}
                  {slugStatus === "taken" && (
                    <X className="size-3.5 shrink-0 text-destructive" />
                  )}
                </div>
                {slugStatus === "taken" && (
                  <p className="text-xs text-destructive">
                    This URL is already taken. Try a different name or slug.
                  </p>
                )}
                {slugStatus === "available" && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    This URL is available.
                  </p>
                )}
              </div>
            )}

            {/* Department */}
            <Field>
              <FieldLabel htmlFor="department">Department</FieldLabel>
              <Input
                id="department"
                placeholder="e.g. Engineering, Marketing"
                {...form.register("department")}
                disabled={form.formState.isSubmitting}
              />
            </Field>

            {/* Team Size */}
            <Field>
              <FieldLabel>Team size</FieldLabel>
              <Controller
                control={form.control}
                name="teamSize"
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={form.formState.isSubmitting}>
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Select team size..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TEAM_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>{size} people</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            {/* Website URL */}
            <Field>
              <FieldLabel htmlFor="websiteUrl">Website URL (optional)</FieldLabel>
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://acme.com"
                {...form.register("websiteUrl")}
                disabled={form.formState.isSubmitting}
              />
              {form.formState.errors.websiteUrl && (
                <FieldError>{form.formState.errors.websiteUrl.message}</FieldError>
              )}
            </Field>

            {/* Accept Terms */}
            <div className="flex items-start gap-3">
              <Controller
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <Checkbox
                    id="accept-terms"
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                    disabled={form.formState.isSubmitting}
                    className="mt-0.5"
                  />
                )}
              />
              <label
                htmlFor="accept-terms"
                className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
              >
                I accept the{" "}
                <a href="/terms" className="text-foreground underline underline-offset-2 hover:text-muted-foreground">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-foreground underline underline-offset-2 hover:text-muted-foreground">
                  Privacy Policy
                </a>.
              </label>
            </div>
            {form.formState.errors.acceptTerms && (
              <p className="text-xs text-destructive">{form.formState.errors.acceptTerms.message}</p>
            )}

            <Button
              type="submit"
              className="h-10 w-full"
              disabled={form.formState.isSubmitting || slugStatus === "checking" || slugStatus === "taken"}
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
