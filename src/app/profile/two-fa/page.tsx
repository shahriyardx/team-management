"use client"

import { useCallback, useEffect, useState } from "react"
import { ShieldCheck, ShieldWarning } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import QRCode from "qrcode"
import { authClient } from "@/lib/auth-client"

export default function TwoFaPage() {
  const {
    data: session,
    isPending: sessionLoading,
    refetch,
  } = authClient.useSession()
  const twoFactorEnabled =
    (session?.user as { twoFactorEnabled?: boolean } | undefined)
      ?.twoFactorEnabled ?? false

  const [hasPassword, setHasPassword] = useState(false)
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [enabling, setEnabling] = useState(false)
  const [totpUri, setTotpUri] = useState("")
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verifyCode, setVerifyCode] = useState("")
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)
  const [disableConfirm, setDisableConfirm] = useState(false)
  const [disabling, setDisabling] = useState(false)
  const [savingCodes, setSavingCodes] = useState(false)
  const [generatingCodes, setGeneratingCodes] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [regenerateConfirm, setRegenerateConfirm] = useState(false)
  const [enablePassword, setEnablePassword] = useState("")
  const [confirmingPassword, setConfirmingPassword] = useState(false)
  const [disablePassword, setDisablePassword] = useState("")
  const [regeneratePassword, setRegeneratePassword] = useState("")

  useEffect(() => {
    if (sessionLoading) return
    authClient
      .$fetch("/list-accounts")
      .then((res: any) => {
        const accounts = (res.data ?? []) as { providerId: string }[]
        setHasPassword(accounts.some((a) => a.providerId === "credential"))
      })
      .finally(() => setAccountsLoading(false))
  }, [sessionLoading])

  const enable2fa = useCallback(async (password?: string) => {
    setEnabling(true)
    const body = hasPassword ? { password: password! } : {}
    const res = await authClient.twoFactor.enable(body as { password: string })
    if (res.error) {
      setError(res.error.message || "Failed to enable two-factor.")
      setEnabling(false)
      return
    }
    setTotpUri(res.data?.totpURI ?? "")
    setBackupCodes(res.data?.backupCodes ?? [])
    setEnabling(false)
  }, [hasPassword])

  // Generate QR when totpUri changes
  useEffect(() => {
    if (!totpUri) {
      setQrDataUrl("")
      return
    }
    QRCode.toDataURL(totpUri, { width: 200, margin: 2 }).then(setQrDataUrl)
  }, [totpUri])

  const handleVerify = useCallback(async () => {
    setVerifyError(null)
    const res = await authClient.twoFactor.verifyTotp({ code: verifyCode })
    if (res.error) {
      setVerifyError("Invalid code. Try again.")
      return
    }
    setVerified(true)
    refetch()
  }, [verifyCode, refetch])

  const handleDisable = useCallback(async (password?: string) => {
    setDisabling(true)
    const body = hasPassword ? { password: password! } : {}
    await authClient.twoFactor.disable(body as { password: string })
    setDisabling(false)
    setDisableConfirm(false)
    setVerified(false)
    setTotpUri("")
    setBackupCodes([])
    setVerifyCode("")
    refetch()
  }, [refetch, hasPassword])

  const copyBackupCodes = useCallback(() => {
    navigator.clipboard.writeText(backupCodes.join("\n"))
    setSavingCodes(true)
    setTimeout(() => setSavingCodes(false), 2000)
  }, [backupCodes])

  const handleGenerateCodes = useCallback(async (password?: string) => {
    setGeneratingCodes(true)
    const body = hasPassword ? { password: password! } : {}
    const res = await authClient.twoFactor.generateBackupCodes(body as { password: string })
    if (!res.error) setBackupCodes(res.data?.backupCodes ?? [])
    setGeneratingCodes(false)
  }, [hasPassword])

  if (sessionLoading || accountsLoading) return <Skeleton className="h-48" />

  const handleEnableClick = () => {
    if (hasPassword) {
      setConfirmingPassword(true)
      setEnablePassword("")
      setError(null)
    } else {
      enable2fa()
    }
  }

  const handleDisableClick = () => {
    if (hasPassword) {
      setDisableConfirm(true)
      setDisablePassword("")
    } else {
      handleDisable()
    }
  }

  const handleRegenerateClick = () => {
    if (hasPassword) {
      setRegenerateConfirm(true)
      setRegeneratePassword("")
    } else {
      handleGenerateCodes().then(() => setShowBackupCodes(true))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Two-Factor Authentication</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Add an extra layer of security to your account.
        </p>
      </div>

      <div className="border border-border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {twoFactorEnabled ? (
              <ShieldCheck className="size-5 text-emerald-500" />
            ) : (
              <ShieldWarning className="size-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {twoFactorEnabled
                  ? "Two-factor authentication is on"
                  : "Two-factor authentication is off"}
              </p>
              <p className="text-xs text-muted-foreground">
                {twoFactorEnabled
                  ? "Your account is protected with an authenticator app."
                  : "Protect your account with an authenticator app like Google Authenticator or Authy."}
              </p>
            </div>
          </div>
          {twoFactorEnabled ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateClick}
                disabled={generatingCodes}
              >
                {generatingCodes ? "Generating..." : "Regenerate backup codes"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDisableClick}
              >
                Disable
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={handleEnableClick} disabled={enabling}>
              {enabling ? "Setting up..." : "Enable"}
            </Button>
          )}
        </div>
      </div>

      {/* Setup flow */}
      {totpUri && !verified && (
        <div className="border border-border p-5 space-y-4">
          <h2 className="text-sm font-medium">Set up authenticator app</h2>

          <div className="flex justify-center">
            {qrDataUrl && (
              <img src={qrDataUrl} alt="QR code" className="size-48" />
            )}
          </div>

          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">
              Scan this QR code with your authenticator app.
            </p>
            <p className="text-xs text-muted-foreground">
              Or enter the key manually:
            </p>
            <p className="font-mono text-xs tracking-widest bg-accent px-3 py-2 inline-block select-all">
              {new URL(totpUri).searchParams.get("secret") ?? ""}
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <InputOTP
              maxLength={6}
              value={verifyCode}
              onChange={setVerifyCode}
              onComplete={handleVerify}
            >
              <InputOTPGroup>
                {Array.from({ length: 6 }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <Button
              onClick={handleVerify}
              disabled={verifyCode.length < 6}
              size="sm"
            >
              Verify
            </Button>
            {verifyError && (
              <p className="text-xs text-destructive">{verifyError}</p>
            )}
          </div>
        </div>
      )}

      {verified && (
        <div className="border border-border p-5 bg-emerald-50/10">
          <p className="text-sm text-emerald-500 font-medium">
            Two-factor authentication enabled.
          </p>
        </div>
      )}

      <Dialog
        open={confirmingPassword}
        onOpenChange={(o) => !o && setConfirmingPassword(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm password</DialogTitle>
            <DialogDescription>
              Enter your password to enable two-factor authentication.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              type="password"
              value={enablePassword}
              onChange={(e) => setEnablePassword(e.target.value)}
              placeholder="Your password"
              onKeyDown={(e) => {
                if (e.key === "Enter" && enablePassword) {
                  setConfirmingPassword(false)
                  enable2fa(enablePassword)
                }
              }}
            />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingPassword(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                setConfirmingPassword(false)
                enable2fa(enablePassword)
              }}
              disabled={!enablePassword}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={regenerateConfirm}
        onOpenChange={(o) => !o && setRegenerateConfirm(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate backup codes?</DialogTitle>
            <DialogDescription>
              This will invalidate your existing backup codes. Make sure to save
              the new ones.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              type="password"
              value={regeneratePassword}
              onChange={(e) => setRegeneratePassword(e.target.value)}
              placeholder="Confirm your password"
              onKeyDown={(e) => {
                if (e.key === "Enter" && regeneratePassword) {
                  setRegenerateConfirm(false)
                  handleGenerateCodes(regeneratePassword)
                  setShowBackupCodes(true)
                }
              }}
            />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRegenerateConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              disabled={!regeneratePassword}
              onClick={async () => {
                setRegenerateConfirm(false)
                await handleGenerateCodes(regeneratePassword)
                setShowBackupCodes(true)
              }}
            >
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showBackupCodes}
        onOpenChange={(o) => !o && setShowBackupCodes(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Backup codes</DialogTitle>
            <DialogDescription>
              Save these codes somewhere safe. Each code can be used once if you
              lose access to your authenticator app.
            </DialogDescription>
          </DialogHeader>
          {backupCodes.length > 0 && (
            <div className="font-mono text-xs space-y-0.5 mx-auto my-2">
              {backupCodes.map((code, i) => (
                <p key={i}>{code}</p>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={copyBackupCodes}>
              {savingCodes ? "Copied!" : "Copy codes"}
            </Button>
            <Button
              variant="default"
              onClick={() => setShowBackupCodes(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={disableConfirm}
        onOpenChange={(o) => !o && setDisableConfirm(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable two-factor authentication?</DialogTitle>
            <DialogDescription>
              Your account will be less secure. You can re-enable it at any
              time.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              placeholder="Confirm your password"
              onKeyDown={(e) => {
                if (e.key === "Enter" && disablePassword) {
                  handleDisable(disablePassword)
                }
              }}
            />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDisable(disablePassword)}
              disabled={disabling || !disablePassword}
            >
              {disabling ? "Disabling..." : "Disable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
