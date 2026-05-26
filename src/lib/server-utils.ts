import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function getSession() {
  const hdrs = await headers()
  const session = await auth.api.getSession({ headers: hdrs })
  if (!session) redirect("/auth/login")
  return session
}

/** Guarantees activeOrganizationId is set. Root layout ensures this before sub-layouts run. */
export async function getOrgSession() {
  const session = await getSession()
  if (!session.session.activeOrganizationId) redirect("/")
  return session as typeof session & {
    session: { activeOrganizationId: string }
  }
}

export async function getMember(organizationId: string, userId: string) {
  return prisma.member.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  })
}
