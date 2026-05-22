"use client"

import { api } from "@/lib/trpc/client"
import { useOrganization } from "@/lib/organization-context"

export type EffectiveRole = "owner" | "admin" | "team_leader" | "member" | "pending"

export function useMemberRole() {
  const { organization } = useOrganization()
  const { data, isLoading } = api.member.getMyRole.useQuery(
    { organizationId: organization?.id ?? "" },
    { enabled: !!organization },
  )
  return { role: (data?.role ?? null) as EffectiveRole | null, loading: isLoading }
}
