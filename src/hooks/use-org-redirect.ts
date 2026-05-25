import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/trpc/client"

export function useOrgRedirect() {
  const router = useRouter()
  const utils = api.useUtils()

  const redirectToFirstOrg = useCallback(
    async (fallbackPath = "/onboard") => {
      let orgs: Array<{ id: string; slug: string }> = []
      try {
        const { organizations } =
          await utils.member.listActiveOrganizations.fetch()
        orgs = organizations
      } catch {
        const { data } = await authClient.organization.list()
        orgs = (data ?? []) as Array<{ id: string; slug: string }>
      }
      if (!orgs.length) {
        router.replace(fallbackPath)
        return
      }
      const org = orgs[0]
      await authClient.organization.setActive({ organizationId: org.id })
      const { data: member } = await authClient.organization.getActiveMember()
      const role =
        member && typeof member === "object" && "role" in member
          ? (member as { role: string }).role
          : "member"
      if (role === "owner" || role === "admin") router.replace(`/${org.slug}`)
      else router.replace(`/${org.slug}/team`)
    },
    [router],
  )

  return { redirectToFirstOrg }
}
