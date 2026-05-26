import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Team OKRs",
  description: "Team OKR assignments.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
