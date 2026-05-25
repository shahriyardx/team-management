import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Members",
  description: "Manage organization members.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
