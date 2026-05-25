import type { Metadata } from "next"
import { ProfileLayoutClient } from "./layout-client"

export const metadata: Metadata = {
  title: "Profile — WeirdTeams",
  description:
    "Manage your WeirdTeams profile, sessions, passkeys, password, and two-factor authentication.",
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProfileLayoutClient>{children}</ProfileLayoutClient>
}
