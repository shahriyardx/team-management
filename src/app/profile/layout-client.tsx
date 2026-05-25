"use client"

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ProfileSidebar } from "@/components/profile-sidebar"
import { ArrowLeft } from "@phosphor-icons/react"
import Link from "next/link"

export function ProfileLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <ProfileSidebar />
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger />
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Dashboard
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
