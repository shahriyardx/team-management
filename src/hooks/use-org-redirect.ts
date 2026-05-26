import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/trpc/client"

export function useOrgRedirect() {
  const router = useRouter()
  const utils = api.useUtils()

  const redirectToFirstOrg = useCallback(
    async (fallbackPath = "/onboard") => {
      const { organizations } =
        await utils.member.listActiveOrganizations.fetch()
      if (!organizations.length) {
        router.replace(fallbackPath)
        return
      }
      const org = organizations[0]
      await authClient.organization.setActive({ organizationId: org.id })
      router.replace(`/${org.slug}`)
    },
    [router, utils],
  )

  return { redirectToFirstOrg }
}
