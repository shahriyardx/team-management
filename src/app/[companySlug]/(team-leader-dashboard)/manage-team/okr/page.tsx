import type { Metadata } from "next"
import TeamOkrDetailPage from "./page-client"

export const metadata: Metadata = {
  title: "Team OKRs",
  description: "Team OKRs.",
}

export default function Page() {
  return <TeamOkrDetailPage />
}
