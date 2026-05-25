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
  return {
    title: `Manage Team — ${name} — WeirdTeams`,
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

  const activeTeamId = session.session.activeTeamId

  if (member.role === "owner" || member.role === "admin") {
    if (!activeTeamId) redirect(`/${companySlug}`)
  } else {
    const ledTeam = await prisma.team.findFirst({
      where: { organizationId: orgId, leaderId: member.id },
    })
    if (!ledTeam) redirect(`/${companySlug}/team`)

    if (activeTeamId) {
      const validTeam = await prisma.team.findFirst({
        where: { id: activeTeamId, organizationId: orgId, leaderId: member.id },
      })
      if (!validTeam) {
        redirect(`/${companySlug}/team`)
      }
    }
  }

  return <>{children}</>
}
