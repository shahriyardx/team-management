import type { Metadata } from "next"
import MembersOkrPage from "./page-client"

export const metadata: Metadata = {
  title: "Member OKRs",
  description: "Team member OKRs.",
}

export default function Page() {
  return <MembersOkrPage />
}
