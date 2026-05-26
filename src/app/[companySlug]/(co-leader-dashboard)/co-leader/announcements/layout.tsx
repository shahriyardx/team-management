import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Announcements",
  description: "Team announcements.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
