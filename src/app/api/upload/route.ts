import { type NextRequest, NextResponse } from "next/server"
import { uploadToR2 } from "@/lib/r2"

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Invalid image file." }, { status: 400 })
  }

  const url = await uploadToR2(file)
  if (!url) {
    return NextResponse.json({ error: "R2 not configured." }, { status: 500 })
  }

  return NextResponse.json({ url })
}
