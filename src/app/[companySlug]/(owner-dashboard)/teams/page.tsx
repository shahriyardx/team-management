import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { TeamManager } from "./components/_team-manager"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ companySlug: string }>
}): Promise<Metadata> {
  const { companySlug } = await params
  const org = await prisma.organization.findUnique({ where: { slug: companySlug } })
  const name = org?.name ?? companySlug
  return { title: "Teams", description: "Manage teams." }
}

export default function TeamsPage() {
  return <TeamManager />
}
