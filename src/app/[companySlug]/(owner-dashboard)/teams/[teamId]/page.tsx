import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { TeamDetail } from "../components/_team-detail"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ companySlug: string; teamId: string }>
}): Promise<Metadata> {
  const { companySlug, teamId } = await params
  const [org, team] = await Promise.all([
    prisma.organization.findUnique({ where: { slug: companySlug } }),
    prisma.team.findUnique({ where: { id: teamId } }),
  ])
  const orgName = org?.name ?? companySlug
  const teamName = team?.name ?? "Team"
  return { title: teamName, description: `View and manage ${teamName}.` }
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params
  return <TeamDetail teamId={teamId} />
}
