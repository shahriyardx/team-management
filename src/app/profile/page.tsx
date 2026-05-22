"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { authClient } from "@/lib/auth-client"

const profileSchema = z.object({
  name: z.string().min(1, "Name is required.").max(48),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { data: session, isPending: sessionLoading } = authClient.useSession()
  const user = session?.user

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const { control, handleSubmit, reset, formState: { errors, isDirty, isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "" },
  })

  useEffect(() => {
    if (user) reset({ name: user.name ?? "" })
  }, [user, reset])

  const onSubmit = handleSubmit(async (data) => {
    await authClient.updateUser({ name: data.name })
    reset({ name: data.name })
  })

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const body = new FormData()
      body.set("file", file)
      const res = await fetch("/api/upload", { method: "POST", body })
      if (!res.ok) return
      const { url } = await res.json()
      await authClient.updateUser({ image: url })
      await authClient.$fetch("/me", { method: "GET" })
    } finally {
      setUploading(false)
    }
  }, [])

  if (sessionLoading) {
    return <Skeleton className="h-48" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Profile</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your name, email, and avatar.</p>
      </div>

      <div className="border border-border p-5">
        <h2 className="text-sm font-medium mb-3">Avatar</h2>
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={user?.image ?? undefined} />
            <AvatarFallback className="text-lg">{user?.name?.charAt(0)?.toUpperCase() ?? "U"}</AvatarFallback>
          </Avatar>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? "Uploading..." : "Change photo"}
          </Button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="border border-border p-5 space-y-4">
        <h2 className="text-sm font-medium">Account</h2>
        <Field>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Controller
            control={control}
            name="name"
            render={({ field }) => <Input id="name" {...field} />}
          />
          <FieldError>{errors.name?.message}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" value={user?.email ?? ""} disabled className="text-muted-foreground" />
        </Field>
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </div>
  )
}
