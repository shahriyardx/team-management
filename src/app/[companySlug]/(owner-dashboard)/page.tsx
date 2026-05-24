import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import OwnerDashboard from "./page-client"

export async function generateMetadata({ params }: { params: Promise<{ companySlug: string }> }): Promise<Metadata> {
  const { companySlug } = await params
  const org = await prisma.organization.findUnique({ where: { slug: companySlug } })
  const name = org?.name ?? companySlug
  return { title: name, description: "Owner dashboard overview." }
}

export default function Page() {
  return <OwnerDashboard />
}
