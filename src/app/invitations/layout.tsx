import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Accept Invitation — WeirdTeams",
  description: "Accept your team invitation and join your organization on WeirdTeams.",
}

export default function InvitationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
