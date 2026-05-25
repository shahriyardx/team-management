import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Team Members",
  description: "View team members.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
