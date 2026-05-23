import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function OwnerLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params
  const hdrs = await headers()
  const session = await auth.api.getSession({ headers: hdrs })
  if (!session) redirect("/auth/login")

  const orgId = session.session.activeOrganizationId
  if (!orgId) redirect("/onboard")

  const member = await prisma.member.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId: session.user.id } },
  })

  if (!member) redirect("/onboard")

  if (member.role === "owner" || member.role === "admin") return <>{children}</>

  const ledTeam = await prisma.team.findFirst({
    where: { organizationId: orgId, leaderId: member.id },
  })

  if (ledTeam) redirect(`/${companySlug}/manage-team`)
  else redirect(`/${companySlug}/team`)
}
