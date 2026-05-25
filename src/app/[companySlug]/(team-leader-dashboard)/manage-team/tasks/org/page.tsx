import type { Metadata } from "next"
import OrgTasksPage from "./page-client"

export const metadata: Metadata = {
  title: "Organization Tasks",
  description: "Org-level tasks assigned to me.",
}

export default function Page() {
  return <OrgTasksPage />
}
