import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import KnowledgeTimelinePage from "./page-client"

export const metadata: Metadata = {
  title: "Knowledge Base",
  description: "Knowledge base.",
}


export default function Page() {
  return <KnowledgeTimelinePage />
}
