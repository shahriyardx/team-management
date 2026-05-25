import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Select a Team",
  description: "Select a team.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
