import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import TeamKnowledgeBasePage from "./page-client"

export const metadata: Metadata = {
  title: "Knowledge Base",
  description: "Knowledge base.",
}


export default function Page() {
  return <TeamKnowledgeBasePage />
}
