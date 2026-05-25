import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { uploadToR2 } from "@/lib/r2"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED_TYPES = [
  "image/",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "text/plain",
  "text/markdown",
  "application/rtf",
  "application/json",
]

const ONE_GB = 1073741824

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const orgId = session.session.activeOrganizationId
  if (!orgId) {
    return NextResponse.json({ error: "No active organization." }, { status: 400 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 })
  }

  if (!file.name.includes(".")) {
    return NextResponse.json({ error: "File must have an extension." }, { status: 400 })
  }

  const allowed = ALLOWED_TYPES.some((t) => file.type.startsWith(t) || file.type === t)
  if (!allowed) {
    return NextResponse.json({ error: "Invalid file type." }, { status: 400 })
  }

  // Check storage quota (calculated from actual attachment sizes)
  const [announcementBytes, kbBytes] = await Promise.all([
    prisma.announcementAttachment.aggregate({
      where: { announcement: { organizationId: orgId } },
      _sum: { size: true },
    }),
    prisma.kbAttachment.aggregate({
      where: { kbItem: { organizationId: orgId } },
      _sum: { size: true },
    }),
  ])

  const currentUsed = Number(announcementBytes._sum.size ?? 0) + Number(kbBytes._sum.size ?? 0)
  if (currentUsed + file.size > ONE_GB) {
    return NextResponse.json({ error: "Storage limit reached (1GB)." }, { status: 413 })
  }

  const url = await uploadToR2(file, "knowledge")
  if (!url) {
    return NextResponse.json({ error: "R2 not configured." }, { status: 500 })
  }

  return NextResponse.json({ url, size: file.size })
}
