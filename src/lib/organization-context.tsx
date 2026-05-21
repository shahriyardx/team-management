"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

type Org = { id: string; name: string; slug: string }

type OrgContextValue = {
  organizations: Org[]
  organization: Org | null
  session: NonNullable<ReturnType<typeof authClient.useSession>["data"]>
  loading: boolean
  onSwitchOrg: (orgId: string) => Promise<void>
  refetchSession: () => Promise<void>
}

const OrgContext = createContext<OrgContextValue | null>(null)

export function OrganizationProvider({
  slug,
  children,
}: {
  slug: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const { data: session, isPending: sessionLoading, refetch: refetchSession } = authClient.useSession()
  const [organizations, setOrganizations] = useState<Org[]>([])
  const [orgsLoading, setOrgsLoading] = useState(true)

  useEffect(() => {
    if (sessionLoading) return
    if (!session) {
      router.replace("/")
      return
    }

    authClient.organization.list().then((res) => {
      const orgs = res.data ?? []
      setOrganizations(orgs)

      const match = orgs.find((o) => o.slug === slug)
      if (!match) {
        router.replace(orgs.length > 0 ? `/dashboard/${orgs[0].slug}` : "/dashboard")
        return
      }
      setOrgsLoading(false)
    })
  }, [session, sessionLoading, router, slug])

  const organization = organizations.find((o) => o.slug === slug) ?? null

  const onSwitchOrg = useCallback(
    async (orgId: string) => {
      await authClient.organization.setActive({ organizationId: orgId })
      await refetchSession()
      const org = organizations.find((o) => o.id === orgId)
      if (org) router.replace(`/dashboard/${org.slug}`)
    },
    [refetchSession, router, organizations],
  )

  const loading = sessionLoading || orgsLoading

  return (
    <OrgContext.Provider
      value={{
        organizations,
        organization,
        session: session!,
        loading,
        onSwitchOrg,
        refetchSession,
      }}
    >
      {children}
    </OrgContext.Provider>
  )
}

export function useOrganization() {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error("useOrganization must be used within an OrganizationProvider")
  return ctx
}
