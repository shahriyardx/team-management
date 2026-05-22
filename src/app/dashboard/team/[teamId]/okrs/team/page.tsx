"use client"

import { use } from "react"
import { useOrganization } from "@/lib/organization-context"
import { useMemberRole } from "@/lib/use-member-role"
import { Skeleton } from "@/components/ui/skeleton"
import { TeamLeaderOkrView } from "./_team-leader-okr-view"

export default function TeamOkrDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params)
  const { organization } = useOrganization()
  const { role, loading } = useMemberRole()

  if (loading || !organization) {
    return <div className="p-6"><Skeleton className="h-48" /></div>
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Team OKR</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Team-level objectives. Fill in progress for your team.</p>
      </div>
      <TeamLeaderOkrView teamId={teamId} />
    </div>
  )
}
