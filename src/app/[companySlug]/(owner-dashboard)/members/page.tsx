import type { Metadata } from "next"
import OrgMembersPage from "./page-client"

export const metadata: Metadata = {
  title: "Members",
  description: "Manage organization members.",
}

export default function Page() {
  return <OrgMembersPage />
}
