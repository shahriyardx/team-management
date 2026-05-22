"use client"

import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Trash } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useOrganization } from "@/lib/organization-context"
import { authClient } from "@/lib/auth-client"

export default function OrgSettingsGeneralPage() {
  const router = useRouter()
  const { organization, refetchSession, refetchOrganizations } = useOrganization()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(organization?.name ?? "")
  const [slug, setSlug] = useState(organization?.slug ?? "")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleting, setDeleting] = useState(false)

  if (!organization) return null

  const hasChanges = name !== organization.name || slug !== organization.slug
  const canDelete = deleteConfirm === organization.name

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    setSuccess(false)
    try {
      const body = new FormData()
      body.set("file", file)
      const res = await fetch("/api/upload", { method: "POST", body })
      if (!res.ok) {
        setError("Failed to upload logo.")
        setUploading(false)
        return
      }
      const { url } = await res.json()
      const updateRes = await authClient.organization.update({
        data: { logo: url },
        organizationId: organization.id,
      })
      if (updateRes.error) {
        setError(updateRes.error.message || "Failed to update logo.")
        setUploading(false)
        return
      }
      setSuccess(true)
      refetchSession()
      refetchOrganizations()
    } finally {
      setUploading(false)
    }
  }, [organization, refetchSession, refetchOrganizations])

  const handleSave = useCallback(async () => {
    setError(null)
    setSuccess(false)
    setSaving(true)
    const data: Record<string, string> = {}
    if (name !== organization.name) data.name = name
    if (slug !== organization.slug) data.slug = slug
    const res = await authClient.organization.update({
      data,
      organizationId: organization.id,
    })
    if (res.error) {
      setError(res.error.message || "Failed to update organization.")
      setSaving(false)
      return
    }
    setSuccess(true)
    setSaving(false)
    refetchSession()
    refetchOrganizations()
  }, [name, slug, organization, refetchSession, refetchOrganizations])

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    await authClient.organization.delete({ organizationId: organization.id })
    await refetchSession()
    router.replace("/add-organization")
  }, [organization, refetchSession, router])

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-lg space-y-6">
        <div>
          <h1 className="text-lg font-semibold">General</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your organization settings.
          </p>
        </div>

        {success && (
          <div className="border border-border p-5 bg-emerald-50/10">
            <p className="text-sm text-emerald-500 font-medium">
              Organization updated successfully.
            </p>
          </div>
        )}

        <div className="border border-border p-5 space-y-4">
          <h2 className="text-sm font-medium">Organization logo</h2>
          <div className="flex items-center gap-4">
            <Avatar className="size-16 rounded-none">
              <AvatarImage src={organization?.logo ?? undefined} />
              <AvatarFallback className="rounded-none text-lg">
                {organization.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Change logo"}
            </Button>
          </div>
        </div>

        <div className="border border-border p-5 space-y-4">
          <h2 className="text-sm font-medium">Organization info</h2>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Slug</label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/g, ""))}
              />
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            size="sm"
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>

        <div className="border border-border p-5 space-y-4">
          <h2 className="text-sm font-medium text-destructive">Danger zone</h2>
          <p className="text-xs text-muted-foreground">
            Once you delete your organization, there is no going back. All data
            will be permanently removed.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash className="size-3.5 mr-1.5" />
            Delete organization
          </Button>
        </div>

        <Dialog open={deleteOpen} onOpenChange={(o) => !o && setDeleteOpen(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete organization</DialogTitle>
              <DialogDescription>
                This action is permanent and cannot be undone. Type{" "}
                <strong>{organization.name}</strong> to confirm.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={organization.name}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!canDelete || deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
