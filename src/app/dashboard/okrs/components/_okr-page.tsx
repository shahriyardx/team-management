"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useOrganization } from "@/lib/organization-context"
import { authClient } from "@/lib/auth-client"
import { AdminOkrDashboard } from "./admin/_admin-okr-dashboard"
import { MemberOkrView } from "./member/_member-okr-view"
import { api } from "@/lib/trpc/client"

export function OkrPage() {
  const { session, organization } = useOrganization()
  const [role, setRole] = useState<string | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {
    if (!organization || !session) {
      if (!organization) setRoleLoading(false)
      return
    }
    setRoleLoading(true)
    authClient.organization
      .listMembers({ query: { organizationSlug: organization.slug } })
      .then((res) => {
        const members = res.data?.members ?? []
        const current = members.find((m: { userId: string }) => m.userId === session?.user?.id)
        setRole(current?.role ?? "member")
        setRoleLoading(false)
      })
      .catch(() => {
        setRole("member")
        setRoleLoading(false)
      })
  }, [organization, session])

  // Active cycle for member view
  const { data: activeCycleData } = api.okrCycle.getActive.useQuery(
    { organizationId: organization?.id ?? "" },
    { enabled: !!organization },
  )
  const { data: cyclesData } = api.okrCycle.list.useQuery(
    { organizationId: organization?.id ?? "", skip: 0, take: 25 },
    { enabled: !!organization },
  )

  const activeCycle = activeCycleData?.cycle
  const cycles = cyclesData?.cycles ?? []
  const defaultCycle = activeCycle ?? cycles[0]

  if (roleLoading || !organization) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  const isAdmin = role === "admin" || role === "owner"

  if (isAdmin) {
    return <AdminOkrDashboard />
  }

  if (!defaultCycle) {
    return (
      <div className="border border-border p-8 text-center text-xs text-muted-foreground">
        No active OKR cycle right now.
      </div>
    )
  }

  return (
    <div className="p-6">
      <MemberOkrView cycleId={defaultCycle.id} locked={!!(defaultCycle as { locked?: boolean }).locked} />
    </div>
  )
}
