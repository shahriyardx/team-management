"use client"

import { useOrganization } from "@/lib/organization-context"
import { useMemberRole } from "@/lib/use-member-role"
import { Skeleton } from "@/components/ui/skeleton"
import { Target } from "@phosphor-icons/react"
import TeamOkrAssignment from "./_team-okr-assignment"

export default function TeamOkrsPage() {
  const { organization } = useOrganization()
  const { role, loading } = useMemberRole()

  if (loading || !organization) {
    return <div className="flex flex-1 items-center justify-center p-6"><Skeleton className="size-8 rounded-full" /></div>
  }

  if (role !== "owner" && role !== "admin") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
        <Target className="size-10 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">Team OKR assignments are managed by admins.</p>
      </div>
    )
  }

  return <TeamOkrAssignment />
}
