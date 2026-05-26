import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Team Tasks",
  description: "All team tasks.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
