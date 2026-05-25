import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Get Started — WeirdTeams",
  description:
    "Set up your organization or join an existing one on WeirdTeams.",
}

export default function OnboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
