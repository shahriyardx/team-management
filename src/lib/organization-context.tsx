"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/trpc/client"

type Org = { id: string; name: string; slug: string; logo?: string | null; websiteUrl?: string | null; department?: string | null; teamSize?: string | null }

type OrgContextValue = {
  organizations: Org[]
  organization: Org | null
  session: NonNullable<ReturnType<typeof authClient.useSession>["data"]>
  loading: boolean
  onSwitchOrg: (orgId: string) => Promise<void>
  refetchSession: () => Promise<void>
  refetchOrganizations: () => Promise<void>
}

const OrgContext = createContext<OrgContextValue | null>(null)

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: session, isPending: sessionLoading, refetch: refetchSession } = authClient.useSession()
  const [organizations, setOrganizations] = useState<Org[]>([])
  const [orgsLoaded, setOrgsLoaded] = useState(false)
  const utils = api.useUtils()

  useEffect(() => {
    if (sessionLoading) return
    if (!session) { router.replace("/"); return }
    if (orgsLoaded) return

    utils.member.listActiveOrganizations.fetch().then(({ organizations }) => {
      setOrganizations(organizations)
      setOrgsLoaded(true)

      if (organizations.length === 0) {
        router.replace("/onboard/add-organization")
        return
      }

      if (!session.session.activeOrganizationId) {
        authClient.organization.setActive({ organizationId: organizations[0].id }).then(() => {
          refetchSession()
        })
      }
    })
  }, [session, sessionLoading, router, orgsLoaded, refetchSession])

  const organization = organizations.find((o) => o.id === session?.session?.activeOrganizationId) ?? null

  const onSwitchOrg = useCallback(
    async (orgId: string) => {
      await authClient.organization.setActive({ organizationId: orgId })
      await refetchSession()
    },
    [refetchSession],
  )

  const refetchOrganizations = useCallback(async () => {
    const { organizations } = await utils.member.listActiveOrganizations.fetch()
    setOrganizations(organizations)
  }, [utils])

  const loading = sessionLoading || !orgsLoaded

  return (
    <OrgContext.Provider
      value={{
        organizations,
        organization,
        session: session!,
        loading,
        onSwitchOrg,
        refetchSession,
        refetchOrganizations,
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
