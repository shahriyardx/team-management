import type { Metadata } from "next"
import MyOkrPage from "./page-client"

export const metadata: Metadata = {
  title: "My OKRs",
  description: "My OKRs.",
}

export default function Page() {
  return <MyOkrPage />
}
