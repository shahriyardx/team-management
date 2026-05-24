import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import AllTasksPage from "./page-client"

export const metadata: Metadata = {
  title: "All Tasks",
  description: "All tasks in the organization.",
}


export default function Page() {
  return <AllTasksPage />
}
