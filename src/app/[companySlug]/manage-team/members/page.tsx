import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import TeamMembersPage from "./page-client"

export const metadata: Metadata = {
  title: "Team Members",
  description: "Manage team members.",
}


export default function Page() {
  return <TeamMembersPage />
}
