"use client"

import { use } from "react"
import { useParams } from "next/navigation"
import { KbDetailContent } from "@/components/knowledge-base/kb-detail-content"

export default function KnowledgeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const { companySlug } = useParams<{ companySlug: string }>()

  return <KbDetailContent slug={slug} baseUrl={`/${companySlug}/team/knowledge-base`} />
}
