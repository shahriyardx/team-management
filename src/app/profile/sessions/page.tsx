"use client"

import { useCallback, useEffect, useState } from "react"
import { Devices } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { authClient } from "@/lib/auth-client"

type Session = {
  id: string
  token: string
  userId: string
  createdAt: Date
  updatedAt: Date
  userAgent: string | null
  ipAddress: string | null
}

function deviceName(ua: string | null): string {
  if (!ua) return "Unknown device"
  const match = ua.match(/\(([^)]+)\)/)
  const os = match ? match[1].split(";")[0].trim() : ""
  if (ua.includes("Chrome/") && !ua.includes("Edg/") && !ua.includes("OPR/"))
    return `Chrome${os ? ` — ${os}` : ""}`
  if (ua.includes("Firefox/")) return `Firefox${os ? ` — ${os}` : ""}`
  if (ua.includes("Safari/") && !ua.includes("Chrome/"))
    return `Safari${os ? ` — ${os}` : ""}`
  if (ua.includes("Edg/")) return `Edge${os ? ` — ${os}` : ""}`
  return ua.split("/")[0] ?? ua.slice(0, 40)
}

function formatIp(ip: string | null): string {
  if (!ip) return "Unknown IP"
  if (ip === "::1" || ip === "0000:0000:0000:0000:0000:0000:0000:0001")
    return "Local"
  if (ip === "127.0.0.1") return "Local"
  return ip
}

export default function SessionsPage() {
  const { data: session } = authClient.useSession()
  const currentToken = session?.session?.token

  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)

  useEffect(() => {
    authClient.listSessions().then((res) => {
      setSessions((res.data ?? []) as Session[])
      setLoading(false)
    })
  }, [])

  const handleRevoke = useCallback(async (token: string) => {
    setRevoking(token)
    await authClient.revokeSession({ token })
    setSessions((prev) => prev.filter((s) => s.token !== token))
    setRevoking(null)
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Sessions</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your active sessions.
        </p>
      </div>

      <div className="border border-border p-5">
        {sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No active sessions.</p>
        ) : (
          <div className="divide-y divide-border">
            {sessions.map((s) => {
              const isCurrent = s.token === currentToken
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <Devices className="size-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs font-medium">
                        {deviceName(s.userAgent)}
                        {isCurrent && (
                          <span className="ml-1.5 text-[10px] text-muted-foreground">
                            (current)
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatIp(s.ipAddress)} &middot;{" "}
                        {new Date(s.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {!isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevoke(s.token)}
                      disabled={revoking === s.token}
                    >
                      {revoking === s.token ? "Revoking..." : "Revoke"}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
