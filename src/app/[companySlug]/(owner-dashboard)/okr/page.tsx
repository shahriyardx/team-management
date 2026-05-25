import type { Metadata } from "next"
import OrgOkrsPage from "./page-client"

export const metadata: Metadata = {
  title: "OKRs",
  description: "Organization OKRs.",
}

export default function Page() {
  return <OrgOkrsPage />
}
