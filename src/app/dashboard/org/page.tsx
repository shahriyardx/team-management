"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"
import { UsersThree } from "@phosphor-icons/react"

export default function OrgWelcomePage() {
  const router = useRouter()
  const { organization } = useOrganization()
  const { data, isLoading } = api.team.getMyTeams.useQuery(
    { organizationId: organization?.id ?? "" },
    { enabled: !!organization, refetchInterval: 10_000 },
  )

  useEffect(() => {
    const teams = data?.teams ?? []
    if (teams.length > 0) {
      router.replace(`/dashboard/team/${teams[0].id}`)
    }
  }, [data, router])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <UsersThree className="size-12 text-muted-foreground/40" />
      <div className="text-center max-w-sm">
        <h2 className="text-sm font-medium text-foreground">Welcome to the organization</h2>
        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
          You haven&apos;t been assigned to a team yet. The org owner or a team leader will add you once teams are set up. You&apos;ll be redirected automatically once added.
        </p>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
        Waiting for team assignment...
      </div>
    </div>
  )
}
