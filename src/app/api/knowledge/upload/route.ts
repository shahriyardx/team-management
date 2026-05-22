import { type NextRequest, NextResponse } from "next/server"
import { uploadToR2 } from "@/lib/r2"

const ALLOWED_TYPES = [
  "image/",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
]

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 })
  }

  const allowed = ALLOWED_TYPES.some((t) => file.type.startsWith(t) || file.type === t)
  if (!allowed) {
    return NextResponse.json({ error: "Invalid file type." }, { status: 400 })
  }

  const url = await uploadToR2(file, "knowledge")
  if (!url) {
    return NextResponse.json({ error: "R2 not configured." }, { status: 500 })
  }

  return NextResponse.json({ url })
}
