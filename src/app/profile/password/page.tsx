"use client"

import { useCallback, useEffect, useState } from "react"
import { LockKeyOpen, GoogleLogo } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { authClient } from "@/lib/auth-client"

type AccountInfo = {
  id: string
  providerId: string
  email?: string
}

export default function PasswordPage() {
  const { data: session, isPending: sessionLoading } = authClient.useSession()

  const [accounts, setAccounts] = useState<AccountInfo[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const hasPassword = accounts.some((a) => a.providerId === "credential")
  const oauthProviders = accounts.filter((a) => a.providerId !== "credential")
  const passwordMismatch = newPassword !== confirmPassword

  useEffect(() => {
    if (sessionLoading) return
    authClient
      .$fetch<AccountInfo[]>("/list-accounts")
      .then((res) => setAccounts(res.data ?? []))
      .catch(() => setError("Failed to load account info."))
      .finally(() => setAccountsLoading(false))
  }, [sessionLoading])

  const handleChangePassword = useCallback(async () => {
    if (passwordMismatch || !currentPassword || !newPassword) return
    setError(null)
    setSuccess(false)
    setSubmitting(true)
    const res = await authClient.changePassword({ currentPassword, newPassword })
    if (res.error) {
      setError(res.error.message || "Failed to change password.")
      setSubmitting(false)
      return
    }
    setSuccess(true)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setSubmitting(false)
  }, [currentPassword, newPassword, passwordMismatch])

  if (sessionLoading || accountsLoading) return <Skeleton className="h-48" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Password</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your account password.
        </p>
      </div>

      {success && (
        <div className="border border-border p-5 bg-emerald-50/10">
          <p className="text-sm text-emerald-500 font-medium">
            Password changed successfully.
          </p>
        </div>
      )}

      {error && (
        <div className="border border-border p-5 bg-destructive/5">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {hasPassword ? (
        <div className="border border-border p-5 space-y-4">
          <h2 className="text-sm font-medium">Change password</h2>
          <div className="space-y-3">
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
            />
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (at least 8 characters)"
            />
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
            <Button
              onClick={handleChangePassword}
              disabled={
                submitting ||
                !currentPassword ||
                !newPassword ||
                newPassword.length < 8 ||
                passwordMismatch
              }
              size="sm"
            >
              {submitting ? "Changing..." : "Change password"}
            </Button>
            {passwordMismatch && confirmPassword && (
              <p className="text-xs text-destructive">
                Passwords do not match.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="border border-border p-5 space-y-3">
          <h2 className="text-sm font-medium">No password set</h2>
          <p className="text-xs text-muted-foreground">
            You signed in using{" "}
            {oauthProviders
              .map((a) => a.providerId.charAt(0).toUpperCase() + a.providerId.slice(1))
              .join(" and ")}
            . There is no password to change.
          </p>
          <div className="flex flex-wrap gap-2 mt-1">
            {oauthProviders.map((a) => (
              <span
                key={a.providerId}
                className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-xs font-medium"
              >
                {a.providerId === "google" ? (
                  <GoogleLogo className="size-3" />
                ) : (
                  <LockKeyOpen className="size-3" />
                )}
                {a.providerId.charAt(0).toUpperCase() + a.providerId.slice(1)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
