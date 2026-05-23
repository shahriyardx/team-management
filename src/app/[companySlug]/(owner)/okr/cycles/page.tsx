import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import CyclesPage from "./page-client"

export const metadata: Metadata = {
  title: "OKR Cycles",
  description: "Manage OKR cycles.",
}


export default function Page() {
  return <CyclesPage />
}
