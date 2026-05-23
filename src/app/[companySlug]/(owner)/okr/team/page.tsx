import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import TeamOkrsPage from "./page-client"

export const metadata: Metadata = {
  title: "Team OKRs",
  description: "Team OKR assignments.",
}


export default function Page() {
  return <TeamOkrsPage />
}
