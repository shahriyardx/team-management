import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getOrgSession } from "@/lib/server-utils"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CoLeaderSidebar } from "@/components/co-leader-sidebar"

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
      default: `Co-Leader Dashboard — ${name}`,
    },
    description: `Co-leader dashboard for ${name}. Manage tasks, announcements, and knowledge base.`,
  }
}

export default async function CoLeaderLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params
  const session = await getOrgSession()

  const activeTeamId = session.session.activeTeamId
  if (!activeTeamId) redirect(`/${companySlug}`)

  const tm = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: activeTeamId, userId: session.user.id } },
    select: { role: true },
  })
  if (tm?.role !== "co-leader") redirect(`/${companySlug}`)

  return (
    <DashboardLayout sidebar={<CoLeaderSidebar />}>{children}</DashboardLayout>
  )
}
