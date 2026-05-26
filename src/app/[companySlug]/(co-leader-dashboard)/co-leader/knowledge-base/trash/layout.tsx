import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Trash",
  description: "Deleted knowledge base articles.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
