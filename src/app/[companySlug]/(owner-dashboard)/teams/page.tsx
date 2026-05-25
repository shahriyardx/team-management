import type { Metadata } from "next"
import { TeamManager } from "./components/_team-manager"

export const metadata: Metadata = {
  title: "Teams",
  description: "Teams",
}

export default function TeamsPage() {
  return <TeamManager />
}
