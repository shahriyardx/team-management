import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Organization Tasks",
  description: "Org-level tasks assigned to me.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
