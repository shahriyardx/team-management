import type { Metadata } from "next"
import MyTasksPage from "./page-client"

export const metadata: Metadata = {
  title: "My Tasks",
  description: "My tasks.",
}

export default function Page() {
  return <MyTasksPage />
}
