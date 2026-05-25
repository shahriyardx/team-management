import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Announcement",
  description: "View announcement.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
