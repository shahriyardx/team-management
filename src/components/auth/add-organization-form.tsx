"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Building, ShieldCheck, X } from "@phosphor-icons/react"
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
  acceptTerms: z
    .boolean()
    .refine((v) => v === true, "You must accept the terms and policies."),
})

type OrgForm = z.infer<typeof orgSchema>

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

export function AddOrganizationForm({
  onNameChange,
}: {
  onNameChange?: (name: string) => void
}) {
  const router = useRouter()

  const [emailNotVerified, setEmailNotVerified] = useState(false)
  const [slug, setSlug] = useState("")
  const [manualSlug, setManualSlug] = useState(false)
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const checkTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    authClient.getSession().then(({ data: session }) => {
      if (session && !session.user.emailVerified) setEmailNotVerified(true)
    })
  }, [])

  const form = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
    defaultValues: { name: "" },
  })

  const nameValue = form.watch("name")

  useEffect(() => {
    onNameChange?.(nameValue ?? "")
  }, [nameValue, onNameChange])

  useEffect(() => {
    if (manualSlug) return
    setSlug(generateSlug(nameValue || ""))
  }, [nameValue, manualSlug])

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

  const handleSlugEdit = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
      setSlug(val)
      setManualSlug(true)
    },
    [],
  )

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    URL.revokeObjectURL(logoPreview ?? "")
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(logoPreview ?? "")
    }
  }, [logoPreview])

  const onSubmit = useCallback(
    async (data: OrgForm) => {
      if (slugStatus !== "available" && slugStatus !== "idle") return

      let logo: string | undefined

      if (logoFile) {
        const body = new FormData()
        body.set("file", logoFile)
        body.set("type", "logos")
        const uploadRes = await fetch("/api/upload", { method: "POST", body })
        if (!uploadRes.ok) {
          form.setError("name", { message: "Logo upload failed." })
          return
        }
        const { url } = await uploadRes.json()
        logo = url
      }

      const res = await authClient.organization.create({
        name: data.name,
        slug,
        logo,
        websiteUrl: data.websiteUrl || undefined,
        department: data.department || undefined,
        teamSize: data.teamSize || undefined,
      } as any)
      const r = res as {
        data: { id: string; slug: string } | null
        error: { message: string } | null
      }
      if (r.error) {
        if (r.error.message.toLowerCase().includes("verify your email")) {
          setEmailNotVerified(true)
        } else {
          form.setError("name", { message: r.error.message })
        }
        return
      }
      if (r.data) {
        await authClient.organization.setActive({ organizationId: r.data.id })
        router.replace(`/${r.data.slug}`)
      } else {
        router.replace("/onboard")
      }
    },
    [form, router, slug, slugStatus, logoFile],
  )

  const hostname =
    typeof window !== "undefined"
      ? window.location.hostname
      : "teams.weirdsoft.co.uk"

  return (
    <div className="w-full">
      {emailNotVerified && (
        <div className="mb-6 rounded-lg border border-border bg-amber-50 p-4 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Email not verified
              </p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                You need to verify your email before creating an organization.{" "}
                <Link
                  href="/profile"
                  className="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-300"
                >
                  Go to profile
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold text-foreground">
        Create your organization
      </h2>
      <p className="mb-8 mt-1 text-sm text-muted-foreground">
        Give your workspace a name.
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Logo upload */}
        <div>
          <span className="mb-2 block text-xs font-medium text-foreground">
            Logo
          </span>
          <div className="relative h-32 w-32">
            <div className="pointer-events-none flex h-32 w-32 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 overflow-hidden">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Organization logo"
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                  <Building className="size-5" />
                  <span className="text-xs">Upload logo</span>
                </div>
              )}
            </div>
            <input
              id="org-logo-upload"
              type="file"
              accept="image/*"
              disabled={form.formState.isSubmitting}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
              onChange={handleLogoUpload}
            />
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

        {/* Editable slug preview */}
        {nameValue && (
          <div className="space-y-2">
            <label
              htmlFor="slug"
              className="block text-xs font-medium text-foreground"
            >
              Workspace URL
            </label>
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
              <span className="text-muted-foreground shrink-0">
                {hostname}/
              </span>
              <input
                id="slug"
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
          <span className="text-xs font-medium text-foreground">Team size</span>
          <Controller
            control={form.control}
            name="teamSize"
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onValueChange={field.onChange}
                disabled={form.formState.isSubmitting}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select team size..." />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size} people
                    </SelectItem>
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
            <a
              href="/terms"
              className="text-foreground underline underline-offset-2 hover:text-muted-foreground"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="text-foreground underline underline-offset-2 hover:text-muted-foreground"
            >
              Privacy Policy
            </a>
            .
          </label>
        </div>
        {form.formState.errors.acceptTerms && (
          <p className="text-xs text-destructive">
            {form.formState.errors.acceptTerms.message}
          </p>
        )}

        <Button
          type="submit"
          className="h-10 w-full"
          disabled={
            emailNotVerified ||
            form.formState.isSubmitting ||
            slugStatus === "checking" ||
            slugStatus === "taken"
          }
        >
          {form.formState.isSubmitting ? "Creating..." : "Create organization"}
        </Button>
      </form>
    </div>
  )
}
