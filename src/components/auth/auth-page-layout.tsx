"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { PublicHeader } from "@/components/public-header"
import { Footer } from "@/components/footer"

interface AuthPageLayoutProps {
  left: React.ReactNode
  right: React.ReactNode
}

export function AuthPageLayout({ left, right }: AuthPageLayoutProps) {
  return (
    <>
      <div className="lg:hidden">
        <PublicHeader />
      </div>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <div className="hidden lg:relative lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:overflow-hidden lg:bg-linear-to-br lg:from-zinc-950 lg:via-zinc-900 lg:to-indigo-950 lg:px-16 lg:py-16">
          {left}
        </div>
        <div className="flex flex-1 bg-background lg:w-1/2 lg:max-h-screen">
          <div className="hidden w-full lg:flex lg:flex-col">
            <ScrollArea className="w-full">
              <div className="flex w-full flex-col items-center px-6 py-16">
                <div className="w-full max-w-sm">{right}</div>
              </div>
            </ScrollArea>
          </div>
          <div className="flex w-full flex-col items-center px-6 py-8 lg:hidden">
            <div className="w-full max-w-sm">{right}</div>
          </div>
        </div>
      </div>
      <div className="lg:hidden">
        <Footer />
      </div>
    </>
  )
}
