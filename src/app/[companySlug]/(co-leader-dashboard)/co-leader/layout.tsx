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
  const hdrs = await headers()
  const session = await auth.api.getSession({ headers: hdrs })
  if (!session) redirect("/auth/login")

  const orgId = session.session.activeOrganizationId
  if (!orgId) redirect("/onboard")

  const member = await prisma.member.findUnique({
    where: {
      organizationId_userId: { organizationId: orgId, userId: session.user.id },
    },
  })
  if (!member) redirect("/onboard")

  // Org admin can access any dashboard
  if (member.role === "owner" || member.role === "admin") {
    return <>{children}</>
  }

  const activeTeamId = session.session.activeTeamId
  if (!activeTeamId) redirect(`/${companySlug}`)

  const tm = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: { teamId: activeTeamId, userId: session.user.id },
    },
    select: { role: true },
  })
  // Not a co-leader — redirect to team dashboard (team layout handles leader/admin redirect)
  if (tm?.role !== "co-leader") redirect(`/${companySlug}/team`)

  return <>{children}</>
}
