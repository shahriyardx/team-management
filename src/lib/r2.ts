import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { env } from "./env"

function getClient() {
  const endpoint = env.R2_ENDPOINT
  const accessKey = env.R2_ACCESS_KEY
  const secretKey = env.R2_SECRET_KEY
  if (!endpoint || !accessKey || !secretKey) return null

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  })
}

export async function uploadToR2(file: File, folder = "logos"): Promise<string | null> {
  const client = getClient()
  if (!client) return null

  const bucket = env.R2_BUCKET
  const publicUrl = env.R2_PUBLIC_URL
  if (!bucket || !publicUrl) return null

  const ext = file.name.split(".").pop() ?? "png"
  const key = `${folder}/${crypto.randomUUID()}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }),
  )

  return `${publicUrl}/${key}`
}
