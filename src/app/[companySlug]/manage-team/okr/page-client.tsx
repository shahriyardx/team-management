"use client"

import { useOrganization } from "@/lib/organization-context"
import { useMemberRole } from "@/lib/use-member-role"
import { authClient } from "@/lib/auth-client"
import { Skeleton } from "@/components/ui/skeleton"
import { TeamLeaderOkrView } from "./_team-leader-okr-view"

export default function TeamOkrDetailPage() {
  const { organization } = useOrganization()
  const { loading } = useMemberRole()
  const { data: session } = authClient.useSession()
  const activeTeamId = session?.session?.activeTeamId

  if (loading || !organization) {
    return <div className="p-6"><Skeleton className="h-48" /></div>
  }

  if (!activeTeamId) {
    return <div className="flex flex-1 items-center justify-center p-6"><p className="text-xs text-muted-foreground">No active team selected.</p></div>
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <TeamLeaderOkrView teamId={activeTeamId} />
    </div>
  )
}
