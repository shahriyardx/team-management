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
    <div className="flex flex-col lg:h-screen lg:overflow-hidden">
      <div className="shrink-0 lg:hidden">
        <PublicHeader />
      </div>
      <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
        <div className="hidden lg:relative lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:overflow-hidden lg:bg-linear-to-br lg:from-zinc-950 lg:via-zinc-900 lg:to-indigo-950 lg:px-16 lg:py-16">
          {left}
        </div>
        <div className="flex flex-1 bg-background lg:min-h-0 lg:w-1/2">
          <div className="hidden w-full lg:flex lg:flex-col">
            <ScrollArea className="size-full">
              <div className="flex w-full flex-col items-center p-20">
                <div className="w-full">{right}</div>
              </div>
            </ScrollArea>
          </div>
          <div className="flex w-full flex-col items-center px-6 py-8 lg:hidden">
            <div className="w-full">{right}</div>
          </div>
        </div>
      </div>
      <div className="shrink-0 lg:hidden">
        <Footer />
      </div>
    </div>
  )
}
