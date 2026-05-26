import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Edit Announcement",
  description: "Edit announcement.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
