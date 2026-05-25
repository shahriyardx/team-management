import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { LoginForm } from "@/components/auth/login-form"

export default async function LoginPage(props: {
  searchParams: Promise<{ callbackURL?: string }>
}) {
  const { callbackURL } = await props.searchParams
  const h = await headers()
  const session = await auth.api.getSession({ headers: h })

  if (session) {
    if (callbackURL) {
      redirect(callbackURL)
    }

    const member = await prisma.member.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        organizationId: true,
        organization: { select: { slug: true } },
      },
    })

    if (member) {
      await auth.api.setActiveOrganization({
        body: { organizationId: member.organizationId },
        headers: h,
      })

      if (member.role === "owner" || member.role === "admin") {
        redirect(`/${member.organization.slug}`)
      }
      redirect(`/${member.organization.slug}/team`)
    }

    redirect("/onboard")
  }

  return <LoginForm callbackURL={callbackURL} />
}
