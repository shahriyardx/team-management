import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Member OKRs",
  description: "Team member OKRs.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
