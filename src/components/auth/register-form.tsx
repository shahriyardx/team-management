"use client"

import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Camera } from "@phosphor-icons/react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"

const registerSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
})

type RegisterForm = z.infer<typeof registerSchema>

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null

  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
  const score = Object.values(checks).filter(Boolean).length

  const colors = [
    "bg-destructive",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
  ]
  const labels = ["Weak", "Fair", "Good", "Strong", "Very strong"]
  const labelColor = [
    "text-destructive",
    "text-orange-500",
    "text-yellow-500",
    "text-lime-500",
    "text-green-500",
  ]

  return (
    <div className="space-y-1 mt-1">
      <div className="flex gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-sm transition-colors ${i < score ? colors[i] : "bg-border"}`}
          />
        ))}
      </div>
      <p
        className={`text-[10px] ${labelColor[score - 1] ?? "text-muted-foreground"}`}
      >
        {labels[score - 1]}
      </p>
    </div>
  )
}

export function RegisterForm({ callbackURL }: { callbackURL?: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  })
  const watchPassword = form.watch("password")

  const handleAvatarSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    },
    [],
  )

  const handleSignUp = useCallback(
    async (data: RegisterForm) => {
      setError(null)
      setLoading(true)
      try {
        let image: string | undefined
        if (avatarFile) {
          const body = new FormData()
          body.set("file", avatarFile)
          body.set("type", "profile-images")
          const res = await fetch("/api/upload", { method: "POST", body })
          if (res.ok) {
            const { url } = await res.json()
            image = url
          }
        }
        const res = await authClient.signUp.email({ ...data, image })
        if (res.error) {
          setError(
            res.error.message || res.error.statusText || "Registration failed.",
          )
          setLoading(false)
          return
        }
        setRegistered(true)
        setLoading(false)
      } catch {
        setError("Registration failed.")
        setLoading(false)
      }
    },
    [avatarFile],
  )

  if (registered) {
    return (
      <div className="w-full max-w-sm mx-auto">
        <h2 className="text-lg font-semibold text-foreground">
          Check your email
        </h2>
        <p className="mb-8 mt-1 text-sm text-muted-foreground">
          A verification link has been sent to{" "}
          <strong>{form.getValues("email")}</strong>.
        </p>
        <div className="border border-border bg-accent/30 p-4 text-xs text-muted-foreground space-y-2">
          <p>
            Click the link in the email to verify your account, then sign in.
          </p>
          <p>Didn&apos;t receive it? Check your spam folder.</p>
        </div>
        <Button
          className="mt-6 w-full"
          variant="outline"
          onClick={() => router.push("/auth/login")}
        >
          Continue to sign in
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <h2 className="text-lg font-semibold text-foreground">Create account</h2>
      <p className="mb-8 mt-1 text-sm text-muted-foreground">
        Get started with your team workspace.
      </p>

      <div className="mb-6">
        <Label>Profile photo</Label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group flex items-center gap-3"
        >
          {avatarPreview ? (
            <Avatar className="size-12 ring-2 ring-border">
              <AvatarImage src={avatarPreview} />
              <AvatarFallback className="bg-muted text-sm">
                {form.watch("name")?.charAt(0)?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/30 transition-colors group-hover:border-muted-foreground/40">
              <Camera className="size-4 text-muted-foreground" />
            </div>
          )}
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
            {avatarPreview ? "Change photo" : "Upload photo"}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarSelect}
        />
      </div>

      <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-4">
        <Field>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            placeholder="Your name"
            {...form.register("name")}
            disabled={loading}
          />
          {form.formState.errors.name && (
            <FieldError errors={[form.formState.errors.name]} />
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...form.register("email")}
            disabled={loading}
          />
          {form.formState.errors.email && (
            <FieldError errors={[form.formState.errors.email]} />
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            {...form.register("password")}
            disabled={loading}
          />
          <PasswordStrength password={watchPassword} />
          {form.formState.errors.password && (
            <FieldError errors={[form.formState.errors.password]} />
          )}
        </Field>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/auth/login${callbackURL ? `?callbackURL=${encodeURIComponent(callbackURL)}` : ""}`}
          className="text-foreground underline underline-offset-4 hover:text-muted-foreground"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
