import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function TeamLayout({
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

  if (member.role === "owner" || member.role === "admin") redirect(`/${companySlug}`)

  const ledTeam = await prisma.team.findFirst({
    where: { organizationId: orgId, leaderId: member.id },
  })

  if (ledTeam) {
    const activeTeamId = session.session.activeTeamId
    if (!activeTeamId || activeTeamId === ledTeam.id) {
      redirect(`/${companySlug}/manage-team`)
    }
  }

  // Validate user is in at least one team
  const teamMember = await prisma.teamMember.findFirst({
    where: { userId: session.user.id, team: { organizationId: orgId } },
  })
  if (!teamMember) redirect(`/${companySlug}/org`)

  // Validate active team still exists and user is still a member
  const activeTeamId = session.session.activeTeamId
  if (activeTeamId) {
    const validMember = await prisma.teamMember.findFirst({
      where: { userId: session.user.id, teamId: activeTeamId },
    })
    if (!validMember) redirect(`/${companySlug}/org`)
  }

  return <>{children}</>
}
