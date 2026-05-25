import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Categories",
  description: "View knowledge base categories.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
