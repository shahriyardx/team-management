"use client"

import { useCallback, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { useOrgRedirect } from "@/hooks/use-org-redirect"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export default function TwoFactorVerificationPage() {
  const { redirectToFirstOrg } = useOrgRedirect()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [method, setMethod] = useState<"totp" | "backup">("totp")
  const [backupCode, setBackupCode] = useState("")

  const handleVerify = useCallback(async () => {
    setError(null)
    setVerifying(true)
    const res =
      method === "totp"
        ? await authClient.twoFactor.verifyTotp({ code })
        : await authClient.twoFactor.verifyBackupCode({ code: backupCode })
    if (res.error) {
      setError(res.error.message || res.error.statusText || "Invalid code.")
      setVerifying(false)
      return
    }

    await redirectToFirstOrg("/onboard")
  }, [code, backupCode, method, redirectToFirstOrg])

  return (
    <div className="w-full max-w-sm">
      <div className="border border-border bg-card p-8">
        <h2 className="text-lg font-semibold text-card-foreground">
          Two-factor authentication
        </h2>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">
          {method === "totp"
            ? "Enter the code from your authenticator app."
            : "Enter one of your backup codes."}
        </p>

        {method === "totp" ? (
          <div className="flex flex-col items-center gap-3">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
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
              disabled={code.length < 6 || verifying}
              size="sm"
            >
              {verifying ? "Verifying..." : "Verify"}
            </Button>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button
              type="button"
              onClick={() => {
                setMethod("backup")
                setError(null)
              }}
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Use a backup code instead
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value)}
              placeholder="XXXXX-XXXXX"
              className="w-full border border-border bg-background px-3 py-2 text-xs text-center font-mono outline-none focus:border-foreground transition-colors"
            />
            <Button
              onClick={handleVerify}
              disabled={!backupCode || verifying}
              className="w-full"
            >
              {verifying ? "Verifying..." : "Verify backup code"}
            </Button>
            {error && (
              <p className="text-xs text-destructive text-center">{error}</p>
            )}
            <button
              type="button"
              onClick={() => {
                setMethod("totp")
                setError(null)
              }}
              className="block w-full text-center text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Use authenticator app instead
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
