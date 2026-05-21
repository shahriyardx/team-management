"use client"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import type { authClient } from "@/lib/auth-client"

type Session = Awaited<ReturnType<typeof authClient.useSession>>["data"]

export function AppSidebar({
  session,
  organizations,
  onSwitchOrg,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  session: Session
  organizations: { id: string; name: string; slug: string }[]
  onSwitchOrg: (orgId: string) => void
}) {
  const activeOrgId = session?.session.activeOrganizationId ?? undefined

  const orgsWithLogos = organizations.map((org) => ({
    ...org,
    logo: (
      <span className="flex size-4 items-center justify-center text-xs font-bold">
        {org.name.charAt(0).toUpperCase()}
      </span>
    ),
  }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          organizations={orgsWithLogos}
          activeOrganizationId={activeOrgId}
          onSwitchOrg={onSwitchOrg}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavProjects />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
