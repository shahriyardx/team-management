import type { Metadata } from "next"
import TeamCategoriesPage from "./page-client"

export const metadata: Metadata = {
  title: "Categories",
  description: "View knowledge base categories.",
}

export default function Page() {
  return <TeamCategoriesPage />
}
