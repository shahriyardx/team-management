import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Team Members",
  description: "Manage team members.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
