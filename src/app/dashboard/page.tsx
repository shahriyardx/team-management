"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export default function DashboardRoot() {
  const router = useRouter()
  const { data: session, isPending: sessionLoading } = authClient.useSession()

  useEffect(() => {
    if (sessionLoading) return

    if (!session) {
      router.replace("/")
      return
    }

    authClient.organization.list().then((res) => {
      const orgs = res.data ?? []
      if (orgs.length > 0) {
        router.replace(`/dashboard/${orgs[0].slug}`)
      } else {
        router.replace("/add-organization")
      }
    })
  }, [session, sessionLoading, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
    </div>
  )
}
