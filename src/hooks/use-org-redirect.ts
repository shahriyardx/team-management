import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export function useOrgRedirect() {
  const router = useRouter()

  const redirectToFirstOrg = useCallback(async (fallbackPath = "/onboard") => {
    const { data: orgs } = await authClient.organization.list()
    if (!orgs?.length) {
      router.replace(fallbackPath)
      return
    }
    const org = orgs[0]
    await authClient.organization.setActive({ organizationId: org.id })
    const { data: member } = await authClient.organization.getActiveMember()
    const role = member && typeof member === "object" && "role" in member
      ? (member as { role: string }).role
      : "member"
    if (role === "owner" || role === "admin") router.replace(`/${org.slug}`)
    else if (role === "team_leader") router.replace(`/${org.slug}/manage-team`)
    else if (role === "pending") router.replace(`/${org.slug}/org`)
    else router.replace(`/${org.slug}/team`)
  }, [router])

  return { redirectToFirstOrg }
}
