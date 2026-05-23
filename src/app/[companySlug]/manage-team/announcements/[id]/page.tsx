"use client"

import { useParams } from "next/navigation"
import { AnnouncementDetail } from "@/components/announcements/announcement-detail"

export default function Page() {
  const { id } = useParams<{ id: string }>()
  return <AnnouncementDetail announcementId={id} />
}
