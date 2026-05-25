import type { Metadata } from "next"
import AssignedTasksPage from "./page-client"

export const metadata: Metadata = {
  title: "Assigned Tasks",
  description: "Tasks assigned to me.",
}

export default function Page() {
  return <AssignedTasksPage />
}
