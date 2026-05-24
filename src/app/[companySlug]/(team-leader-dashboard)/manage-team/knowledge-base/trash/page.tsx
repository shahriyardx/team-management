import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import TrashPage from "./page-client"

export const metadata: Metadata = {
  title: "Trash",
  description: "Deleted knowledge base articles.",
}


export default function Page() {
  return <TrashPage />
}
