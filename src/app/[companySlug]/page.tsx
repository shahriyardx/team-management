import { redirect } from "next/navigation"
import { getOrgSession, getMember } from "@/lib/server-utils"
import { prisma } from "@/lib/prisma"

async function hasAccessToTeam(userId: string, teamId: string, orgId: string) {
  const tm = await prisma.teamMember.findFirst({
    where: { userId, teamId, team: { organizationId: orgId }, status: "active" },
    select: { role: true },
  })
  if (!tm) return null
  return { teamId, role: tm.role }
}

async function getFirstTeamWithAccess(userId: string, orgId: string) {
  const first = await prisma.teamMember.findFirst({
    where: { userId, status: "active", team: { organizationId: orgId } },
    select: { teamId: true, role: true },
  })
  if (!first) return null
  return { teamId: first.teamId, role: first.role }
}

const getRouteByRole = (slug: string, role: string) => {
  const routeMap = {
    owner: `/${slug}/dashboard`,
    admin: `/${slug}/dashboard`,
    leader: `/${slug}/manage-team`,
    member: `/${slug}/team`,
    "co-leader": `/${slug}/co-leader`,
  }

  return routeMap[role as keyof typeof routeMap]
}

export default async function CompanyHub({
  params,
}: {
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params
  const session = await getOrgSession()
  const member = await getMember(
    session.session.activeOrganizationId,
    session.user.id,
  )

  if (!member) redirect("/")

  if (member?.role === "owner" || member?.role === "admin")
    redirect(`/${companySlug}/dashboard`)

  if (session.session.activeTeamId) {
    const hasAccess = await hasAccessToTeam(
      session.user.id,
      session.session.activeTeamId,
      session.session.activeOrganizationId,
    )
    const firstTeamWithAccess = await getFirstTeamWithAccess(
      session.user.id,
      session.session.activeOrganizationId,
    )
    if (hasAccess) {
      redirect(getRouteByRole(companySlug, hasAccess.role))
    } else {
      if (firstTeamWithAccess) {
        await prisma.session.update({
          where: { id: session.session.id },
          data: { activeTeamId: firstTeamWithAccess.teamId },
        })
        redirect(getRouteByRole(companySlug, firstTeamWithAccess.role))
      }
    }
  } else {
    const firstTeamWithAccess = await getFirstTeamWithAccess(
      session.user.id,
      session.session.activeOrganizationId,
    )

    if (firstTeamWithAccess) {
      await prisma.session.update({
        where: { id: session.session.id },
        data: { activeTeamId: firstTeamWithAccess.teamId },
      })
      redirect(getRouteByRole(companySlug, firstTeamWithAccess.role))
    }
  }

  redirect("/")
}
