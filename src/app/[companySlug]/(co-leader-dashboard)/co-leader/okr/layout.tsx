import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "My OKRs",
  description: "View your OKRs.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
