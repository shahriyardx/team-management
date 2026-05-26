import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CompanyLayoutClient } from "./layout-client"

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
    title: `${name} — WeirdTeams`,
    description: `Manage your team's tasks, knowledge base, and OKRs on WeirdTeams.`,
  }
}

export default async function CompanyLayout({
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

  // Look up org by slug
  const org = await prisma.organization.findUnique({
    where: { slug: companySlug },
  })

  // Verify user is member of this org
  const member = org
    ? await prisma.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: org.id,
            userId: session.user.id,
          },
        },
      })
    : null

  if (!org || !member) {
    const userOrgs = await prisma.member.findMany({
      where: { userId: session.user.id },
      include: { organization: { select: { slug: true } } },
      orderBy: { createdAt: "asc" },
    })
    if (userOrgs.length === 0) redirect("/onboard")
    redirect(`/${userOrgs[0].organization.slug}`)
  }

  if (member.status === "inactive") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6">
        <h1 className="text-lg font-semibold text-foreground">
          Account Deactivated
        </h1>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Your access to this organization has been deactivated. Contact your
          organization owner for more information.
        </p>
      </div>
    )
  }

  // If active org doesn't match URL slug, update session
  if (org.id !== session.session.activeOrganizationId) {
    await prisma.session.update({
      where: { id: session.session.id },
      data: { activeOrganizationId: org.id, activeTeamId: null },
    })
    // Redirect to same URL so server re-renders with updated session
    redirect(`/${companySlug}`)
  }

  return <CompanyLayoutClient>{children}</CompanyLayoutClient>
}
