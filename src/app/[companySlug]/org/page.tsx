import type { Metadata } from "next"
import OrgWelcomePage from "./page-client"

export const metadata: Metadata = {
  title: "Select a Team",
  description: "Select a team.",
}

export default function Page() {
  return <OrgWelcomePage />
}
