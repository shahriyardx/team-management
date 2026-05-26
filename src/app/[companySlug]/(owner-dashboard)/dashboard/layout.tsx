import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { getOrgSession, getMember } from "@/lib/server-utils"
import { DashboardLayout } from "@/components/dashboard-layout"
import { OwnerSidebar } from "@/components/owner-sidebar"

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
    title: {
      template: `%s — ${name}`,
      default: `Dashboard — ${name}`,
    },
    description: `Owner dashboard for ${name}. Manage teams, tasks, OKRs, and settings.`,
  }
}

export default async function OwnerLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params
  const session = await getOrgSession()
  const member = await getMember(session.session.activeOrganizationId, session.user.id)

  if (member?.role === "owner" || member?.role === "admin")
    return (
      <DashboardLayout sidebar={<OwnerSidebar />}>{children}</DashboardLayout>
    )

  redirect(`/${companySlug}`)
}
