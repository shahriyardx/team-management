"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/trpc/client"

export default function OrgWelcomePage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.companySlug as string
  const [checking, setChecking] = useState(true)
  const utils = api.useUtils()

  useEffect(() => {
    if (!slug) return

    let cancelled = false

    authClient.organization.list().then(async () => {
      if (cancelled) return
      const { data: sessionData } = await authClient.getSession()
      const activeTeamId = sessionData?.session?.activeTeamId
      const orgId = sessionData?.session?.activeOrganizationId
      const userId = sessionData?.user?.id
      if (!orgId) { setChecking(false); return }

      // Fetch teams user actually belongs to
      let rawTeams: Array<{ id: string; members?: Array<{ userId: string; status: string }> }> = []
      try {
        const data = await utils.team.getMyTeams.fetch({ organizationId: orgId })
        rawTeams = (data as { teams: typeof rawTeams }).teams ?? []
      } catch {}

      if (cancelled) return

      // Filter out teams where user's membership is inactive
      const myTeams = userId
        ? rawTeams.filter((t) => {
            const m = t.members?.find((tm) => tm.userId === userId)
            return m && m.status !== "inactive"
          })
        : rawTeams

      // Validate active team is still valid
      if (activeTeamId && myTeams.some((t) => t.id === activeTeamId)) {
        router.replace(`/${slug}/team`)
        return
      }

      // Set first available team
      if (myTeams.length > 0) {
        await authClient.organization.setActiveTeam({ teamId: myTeams[0].id })
        router.replace(`/${slug}/team`)
        return
      }

      setChecking(false)
    })

    return () => { cancelled = true }
  }, [slug, router])

  if (checking) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-lg font-semibold text-foreground">Welcome!</h1>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        You're part of this organization but haven't been assigned to a team yet.
        Reach out to your admin to get added to a team.
      </p>
    </div>
  )
}
