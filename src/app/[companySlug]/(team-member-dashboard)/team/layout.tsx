import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ companySlug: string }>
}): Promise<Metadata> {
  const { companySlug } = await params
  const org = await prisma.organization.findUnique({ where: { slug: companySlug } })
  const name = org?.name ?? "WeirdTeams"
  return {
    title: `Team — ${name} — WeirdTeams`,
    description: `Team dashboard for ${name}. View tasks, knowledge base, OKRs, and team members.`,
  }
}

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

  if (member.role === "owner" || member.role === "admin") {
    const activeTeamId = session.session.activeTeamId
    if (!activeTeamId) redirect(`/${companySlug}`)
    const ledTeam = await prisma.team.findFirst({
      where: { id: activeTeamId, organizationId: orgId, leaderId: member.id },
    })
    if (ledTeam) redirect(`/${companySlug}/manage-team`)
  } else {
    const ledTeam = await prisma.team.findFirst({
      where: { organizationId: orgId, leaderId: member.id },
    })

    if (ledTeam) {
      const activeTeamId = session.session.activeTeamId
      if (!activeTeamId || activeTeamId === ledTeam.id) {
        redirect(`/${companySlug}/manage-team`)
      }
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
    if (validMember.status === "inactive") {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6">
          <h2 className="text-sm font-medium text-foreground">Access Deactivated</h2>
          <p className="text-xs text-muted-foreground text-center max-w-md">
            Your access to this team has been deactivated. Contact your team leader or organization
            owner for more information.
          </p>
        </div>
      )
    }
  }

  return <>{children}</>
}
