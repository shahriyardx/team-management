"use client"

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useOrganization } from "@/lib/organization-context"
import { NotificationBell } from "@/components/notification-bell"

export function DashboardLayout(props: {
  sidebar: React.ReactNode
  children: React.ReactNode
}) {
  const { loading } = useOrganization()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      {props.sidebar}
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger />
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>
        {props.children}
      </SidebarInset>
    </SidebarProvider>
  )
}
