import type { Metadata } from "next"
import GeneralSettingsPage from "./page-client"

export const metadata: Metadata = {
  title: "Settings",
  description: "Organization settings.",
}

export default function Page() {
  return <GeneralSettingsPage />
}
