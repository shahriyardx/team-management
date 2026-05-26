import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Organization Tasks",
  description: "All organization tasks.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
