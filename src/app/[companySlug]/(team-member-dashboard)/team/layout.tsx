import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getOrgSession, getMember } from "@/lib/server-utils"
import { DashboardLayout } from "@/components/dashboard-layout"
import { MemberSidebar } from "@/components/member-sidebar"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ companySlug: string }>
}): Promise<Metadata> {
  const { companySlug } = await params
  const org = await prisma.organization.findUnique({
    where: { slug: companySlug },
  })
  const name = org?.name ?? "WeirdTeams"

  const hdrs = await headers()
  const session = await auth.api.getSession({ headers: hdrs })
  let teamName: string | undefined
  if (session?.session.activeTeamId) {
    const team = await prisma.team.findUnique({
      where: { id: session.session.activeTeamId },
      select: { name: true },
    })
    teamName = team?.name
  }

  return {
    title: {
      template: `%s — ${teamName || name}`,
      default: `Team — ${name}`,
    },
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
  const session = await getOrgSession()
  const member = await getMember(
    session.session.activeOrganizationId,
    session.user.id,
  )

  if (member?.role === "owner" || member?.role === "admin") {
    if (!session.session.activeTeamId) redirect(`/${companySlug}`)
    return (
      <DashboardLayout sidebar={<MemberSidebar />}>{children}</DashboardLayout>
    )
  }

  const ledTeam = await prisma.team.findFirst({
    where: {
      organizationId: session.session.activeOrganizationId,
      leaderId: member!.id,
    },
  })

  // Leader viewing own team or no activeTeamId → send to manage-team
  if (ledTeam) {
    if (
      !session.session.activeTeamId ||
      session.session.activeTeamId === ledTeam.id
    ) {
      redirect(`/${companySlug}/manage-team`)
    }
    // Leader viewing a different team → stay
  }

  const teamMember = await prisma.teamMember.findFirst({
    where: {
      userId: session.user.id,
      team: { organizationId: session.session.activeOrganizationId },
    },
  })
  if (!teamMember) redirect(`/${companySlug}`)

  const activeTeamId = session.session.activeTeamId
  if (activeTeamId) {
    const validMember = await prisma.teamMember.findFirst({
      where: { userId: session.user.id, teamId: activeTeamId },
    })
    if (!validMember) redirect(`/${companySlug}`)
    if (validMember.status === "inactive") {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6">
          <h2 className="text-sm font-medium text-foreground">
            Access Deactivated
          </h2>
          <p className="text-xs text-muted-foreground text-center max-w-md">
            Your access to this team has been deactivated. Contact your team
            leader or organization owner for more information.
          </p>
        </div>
      )
    }
  }

  return (
    <DashboardLayout sidebar={<MemberSidebar />}>{children}</DashboardLayout>
  )
}
