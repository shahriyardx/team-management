import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import KnowledgeDetailPage from "./page-client"

export async function generateMetadata({ params }: { params: Promise<{ companySlug: string; slug: string }> }): Promise<Metadata> {
  const { companySlug, slug } = await params
  const article = await prisma.kbItem.findUnique({ where: { id: slug } })
  const articleTitle = article?.title ?? "Knowledge Base"
  return { title: articleTitle, description: `View ${articleTitle}.` }
}

export default async function Page({ params }: { params: Promise<{ companySlug: string; slug: string }> }) {
  const { slug } = await params
  return <KnowledgeDetailPage params={Promise.resolve({ slug })} />
}
