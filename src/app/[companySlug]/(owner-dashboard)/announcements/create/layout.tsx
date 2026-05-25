import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create Announcement",
  description: "Create a new announcement.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
