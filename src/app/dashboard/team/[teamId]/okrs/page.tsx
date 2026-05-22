"use client"

import { use } from "react"
import { useOrganization } from "@/lib/organization-context"
import { useMemberRole } from "@/lib/use-member-role"
import { api } from "@/lib/trpc/client"
import { Skeleton } from "@/components/ui/skeleton"
import { MemberOkrView } from "@/app/dashboard/okrs/components/member/_member-okr-view"

export default function TeamOkrPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params)
  const { organization } = useOrganization()
  const { role, loading } = useMemberRole()

  const { data: activeCycle } = api.okrCycle.getActive.useQuery(
    { organizationId: organization?.id ?? "" },
    { enabled: !!organization },
  )

  if (loading || !organization) {
    return <div className="p-6"><Skeleton className="h-48" /></div>
  }

  const cycleId = activeCycle?.cycle?.id

  if (!cycleId) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-xs text-muted-foreground">No active OKR cycle right now.</p>
      </div>
    )
  }

  // Team leader sees a summary; members see their personal OKRs
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">My OKRs</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your personal objectives and key results.</p>
      </div>
      <MemberOkrView cycleId={cycleId} locked={!!(activeCycle?.cycle as { locked?: boolean } | null)?.locked} />
    </div>
  )
}
