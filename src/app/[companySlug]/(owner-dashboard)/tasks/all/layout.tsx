import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "All Tasks",
  description: "All tasks in the organization.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
