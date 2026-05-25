import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import TeamLeaderDashboardPage from "./page-client"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ companySlug: string }>
}): Promise<Metadata> {
  const { companySlug } = await params
  const org = await prisma.organization.findUnique({
    where: { slug: companySlug },
  })
  const _name = org?.name ?? companySlug
  return { title: "Overview", description: "Team leader dashboard." }
}

export default function Page() {
  return <TeamLeaderDashboardPage />
}
