"use client"

import { use } from "react"
import { useOrganization } from "@/lib/organization-context"
import { useMemberRole } from "@/lib/use-member-role"
import { Skeleton } from "@/components/ui/skeleton"
import { TeamMembersOkr } from "./_team-members-okr"

export default function MembersOkrPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params)
  const { organization } = useOrganization()
  const { role, loading } = useMemberRole()

  if (loading || !organization) {
    return <div className="p-6"><Skeleton className="h-48" /></div>
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Members OKR</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Assign and manage individual member OKRs.</p>
      </div>
      <TeamMembersOkr teamId={teamId} />
    </div>
  )
}
