import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getOrgSession, getMember } from "@/lib/server-utils"
import { DashboardLayout } from "@/components/dashboard-layout"
import { LeaderSidebar } from "@/components/leader-sidebar"

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
      default: `Manage Team — ${name}`,
    },
    description: `Team leader dashboard for ${name}. Manage your team's tasks, knowledge base, OKRs, and members.`,
  }
}

export default async function ManageTeamLayout({
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
  const activeTeamId = session.session.activeTeamId

  if (!activeTeamId || !member) redirect(`/${companySlug}`)

  const teamMember = await prisma.teamMember.findFirst({
    where: {
      userId: session.user.id,
      teamId: activeTeamId,
      role: "leader",
    },
  })
  if (!teamMember) redirect(`/${companySlug}`)

  return (
    <DashboardLayout sidebar={<LeaderSidebar />}>{children}</DashboardLayout>
  )
}
