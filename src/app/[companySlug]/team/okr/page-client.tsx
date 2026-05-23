"use client"

import { useOrganization } from "@/lib/organization-context"
import { useMemberRole } from "@/lib/use-member-role"
import { api } from "@/lib/trpc/client"
import { Skeleton } from "@/components/ui/skeleton"
import { MemberOkrView } from "./member/_member-okr-view"

export default function MyOkrPage() {
  const { organization } = useOrganization()
  const { loading } = useMemberRole()
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

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <MemberOkrView cycleId={cycleId} locked={!!(activeCycle?.cycle as { locked?: boolean } | null)?.locked} />
    </div>
  )
}
