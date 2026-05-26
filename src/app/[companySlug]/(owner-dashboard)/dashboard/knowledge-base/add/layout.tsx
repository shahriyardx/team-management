import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "New Article",
  description: "Create a new knowledge base article.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
