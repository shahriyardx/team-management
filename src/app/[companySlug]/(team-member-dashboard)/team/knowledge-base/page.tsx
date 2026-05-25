import type { Metadata } from "next"
import TeamKnowledgeBasePage from "./page-client"

export const metadata: Metadata = {
  title: "Knowledge Base",
  description: "Knowledge base.",
}

export default function Page() {
  return <TeamKnowledgeBasePage />
}
