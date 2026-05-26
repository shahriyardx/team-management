"use client"

import { useEffect } from "react"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useOrganization } from "@/lib/organization-context"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/trpc/client"
import { NotificationBell } from "@/components/notification-bell"

export function DashboardLayout(props: {
  sidebar: React.ReactNode
  children: React.ReactNode
}) {
  const { session, organization, loading } = useOrganization()

  const { data: myTeamsData } = api.team.getMyTeams.useQuery(
    { organizationId: organization?.id ?? "" },
    {
      enabled: !!organization && !session?.session?.activeTeamId,
    },
  )

  useEffect(() => {
    if (!myTeamsData || session?.session?.activeTeamId) return
    const teams = (myTeamsData as { teams?: Array<{ id: string }> } | undefined)?.teams
    if (teams && teams.length > 0) {
      authClient.organization
        .setActiveTeam({ teamId: teams[0].id })
        .then(() => {
          window.location.reload()
        })
    }
  }, [myTeamsData, session])

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
