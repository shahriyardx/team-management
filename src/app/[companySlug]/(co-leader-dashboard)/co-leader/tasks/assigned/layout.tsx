import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Assigned Tasks",
  description: "Tasks assigned to team members.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
