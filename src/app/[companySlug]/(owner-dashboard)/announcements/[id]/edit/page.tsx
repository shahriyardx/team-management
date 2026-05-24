"use client"

import { useParams } from "next/navigation"
import { AnnouncementForm } from "@/components/announcements/announcement-create"

export default function Page() {
  const { id } = useParams<{ id: string }>()
  return <AnnouncementForm announcementId={id} />
}
