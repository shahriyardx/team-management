import type { Metadata } from "next"
import TrashPage from "./page-client"

export const metadata: Metadata = {
  title: "Trash",
  description: "Deleted knowledge base articles.",
}

export default function Page() {
  return <TrashPage />
}
