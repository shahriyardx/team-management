import type { Metadata } from "next"
import CategoriesPage from "./page-client"

export const metadata: Metadata = {
  title: "Categories",
  description: "Manage knowledge base categories.",
}

export default function Page() {
  return <CategoriesPage />
}
