import type { Metadata } from "next"
import TeamMembersPage from "./page-client"

export const metadata: Metadata = {
  title: "Team Members",
  description: "View team members.",
}

export default function Page() {
  return <TeamMembersPage />
}
