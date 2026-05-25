import type { Metadata } from "next"
import { Space_Grotesk } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { TRPCProvider } from "@/lib/trpc/provider"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
})

export const metadata: Metadata = {
  title: "WeirdTeams — Team Management Platform",
  description:
    "A simple workspace for teams that want to move faster. Tasks, knowledge base, OKR tracking, and member management in one place.",
  openGraph: {
    title: "WeirdTeams",
    description:
      "A simple workspace for teams that want to move faster. Tasks, knowledge base, OKR tracking, and member management in one place.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full dark antialiased", spaceGrotesk.variable)}
    >
      <body className="min-h-full flex flex-col">
        <TRPCProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </TRPCProvider>
      </body>
    </html>
  )
}
