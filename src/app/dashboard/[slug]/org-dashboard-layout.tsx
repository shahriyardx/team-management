"use client"

import { use } from "react"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { OrganizationProvider, useOrganization } from "@/lib/organization-context"
import { AppSidebar } from "@/components/app-sidebar"

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { session, organizations, onSwitchOrg, loading } = useOrganization()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar
        session={session}
        organizations={organizations}
        onSwitchOrg={onSwitchOrg}
      />
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger />
          <span className="text-xs text-muted-foreground">{session?.user?.email}</span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

export function OrgDashboardLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}) {
  const { slug } = use(params)

  return (
    <OrganizationProvider slug={slug}>
      <DashboardShell>{children}</DashboardShell>
    </OrganizationProvider>
  )
}
