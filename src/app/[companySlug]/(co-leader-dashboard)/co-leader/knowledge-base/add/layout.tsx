import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Add Knowledge",
  description: "Add a knowledge base article.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
