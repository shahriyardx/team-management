import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "All Tasks",
  description: "All tasks.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
