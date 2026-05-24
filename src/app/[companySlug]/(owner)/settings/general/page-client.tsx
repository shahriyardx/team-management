"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useOrganization } from "@/lib/organization-context"
import { authClient } from "@/lib/auth-client"

const TEAM_SIZES = ["1-10", "11-50", "51-200", "200+"] as const

const orgSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
  slug: z
    .string()
    .min(1, "Slug is required.")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens."),
  websiteUrl: z.string().url("Enter a valid URL.").optional().or(z.literal("")),
  department: z.string().optional(),
  teamSize: z.string().optional(),
})

type OrgForm = z.infer<typeof orgSchema>

export default function GeneralSettingsPage() {
  const { organization, refetchOrganizations } = useOrganization()
  const [saving, setSaving] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)

  const form = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
    values: {
      name: organization?.name ?? "",
      slug: organization?.slug ?? "",
      websiteUrl: organization?.websiteUrl ?? "",
      department: organization?.department ?? "",
      teamSize: organization?.teamSize ?? "",
    },
  })

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !organization) return
    setLogoUploading(true)
    setLogoError(null)
    try {
      const body = new FormData()
      body.set("file", file)
      const res = await fetch("/api/upload", { method: "POST", body })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }))
        setLogoError(err.error)
        return
      }
      const { url } = await res.json()
      await authClient.organization.update({
        organizationId: organization.id,
        data: { logo: url },
      })
      await refetchOrganizations()
    } catch {
      setLogoError("Upload failed.")
    } finally {
      setLogoUploading(false)
    }
  }

  async function onSubmit(data: OrgForm) {
    if (!organization) return

    const slugChanged = data.slug !== organization.slug
    if (slugChanged) {
      const { error } = await authClient.organization.checkSlug({
        slug: data.slug,
      })
      if (error) {
        form.setError("slug", { message: "This slug is already taken." })
        return
      }
    }

    setSaving(true)
    try {
      await authClient.organization.update({
        organizationId: organization.id,
        data: {
          name: data.name,
          slug: data.slug,
          websiteUrl: data.websiteUrl || undefined,
          department: data.department || undefined,
          teamSize: data.teamSize || undefined,
        } as any,
      })
      await refetchOrganizations()
    } finally {
      setSaving(false)
    }
  }

  if (!organization) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Skeleton className="size-8 rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-lg">
      <div>
        <h1 className="text-lg font-semibold">General Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your organization settings.
        </p>
      </div>

      <Field>
        <FieldLabel>Organization Logo</FieldLabel>
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarImage
              src={organization.logo ?? undefined}
              // className="rounded-full"
            />
            <AvatarFallback className=" text-sm font-bold">
              {organization.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={logoUploading}
              onClick={() => document.getElementById("logo-upload")?.click()}
            >
              {logoUploading ? "Uploading..." : "Upload Logo"}
            </Button>
            {logoError && (
              <p className="text-xs text-destructive mt-1">{logoError}</p>
            )}
          </div>
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </div>
      </Field>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Field>
          <FieldLabel>Organization Name</FieldLabel>
          <Input {...form.register("name")} maxLength={100} />
          {form.formState.errors.name && (
            <FieldError>{form.formState.errors.name.message}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel>Organization Slug</FieldLabel>
          <Input {...form.register("slug")} maxLength={100} />
          {form.formState.errors.slug && (
            <FieldError>{form.formState.errors.slug.message}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel>Website URL (optional)</FieldLabel>
          <Input
            type="url"
            placeholder="https://acme.com"
            {...form.register("websiteUrl")}
          />
          {form.formState.errors.websiteUrl && (
            <FieldError>{form.formState.errors.websiteUrl.message}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel>Department</FieldLabel>
          <Input
            placeholder="e.g. Engineering, Marketing"
            {...form.register("department")}
          />
        </Field>
        <Field>
          <FieldLabel>Team size</FieldLabel>
          <Controller
            control={form.control}
            name="teamSize"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger>
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
        <Button type="submit" size="sm" disabled={saving}>
          Save
        </Button>
      </form>
    </div>
  )
}
