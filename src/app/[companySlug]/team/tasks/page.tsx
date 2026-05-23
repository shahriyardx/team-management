import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import MyTasksPage from "./page-client"

export const metadata: Metadata = {
  title: "My Tasks",
  description: "My tasks.",
}


export default function Page() {
  return <MyTasksPage />
}
