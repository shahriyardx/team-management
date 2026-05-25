import type { Metadata } from "next"
import AddKnowledgePage from "./page-client"

export const metadata: Metadata = {
  title: "New Article",
  description: "Create a new knowledge base article.",
}

export default function Page() {
  return <AddKnowledgePage />
}
