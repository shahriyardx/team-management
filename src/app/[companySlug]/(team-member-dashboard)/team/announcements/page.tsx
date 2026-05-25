"use client"

import { AnnouncementList } from "@/components/announcements/announcement-list"

export default function Page() {
  return <AnnouncementList showScopeToggle defaultScope="team" />
}
