import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import OrgWelcomePage from "./page-client"

export const metadata: Metadata = {
  title: "Select a Team",
  description: "Select a team.",
}


export default function Page() {
  return <OrgWelcomePage />
}
