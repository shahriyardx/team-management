"use client"

import { useOrganization } from "@/lib/organization-context"
import { useMemberRole } from "@/lib/use-member-role"
import { Skeleton } from "@/components/ui/skeleton"
import { MemberOkrView } from "./member/_member-okr-view"

export default function MyOkrPage() {
  const { organization } = useOrganization()
  const { loading } = useMemberRole()

  if (loading || !organization) {
    return (
      <div className="p-6">
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <MemberOkrView />
    </div>
  )
}
