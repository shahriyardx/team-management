"use client"

import { useRouter, useParams, usePathname } from "next/navigation"
import { CaretUpDownIcon, PlusIcon } from "@phosphor-icons/react"
import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function TeamSwitcher() {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const { isMobile } = useSidebar()
  const { session, organizations, organization: activeOrg, onSwitchOrg } = useOrganization()

  const isTeamRoute = pathname.startsWith("/dashboard/team/")
  const teamId = params?.teamId as string | undefined

  const activeOrgId = session?.session.activeOrganizationId ?? undefined
  const org = activeOrg ?? organizations.find((o) => o.id === activeOrgId) ?? organizations[0]

  // Teams for current org
  const { data: myTeamsData } = api.team.getMyTeams.useQuery(
    { organizationId: org?.id ?? "" },
    { enabled: !!org && isTeamRoute },
  )
  const teams = (myTeamsData as { teams?: Array<{ id: string; name: string }> } | undefined)?.teams ?? []
  const activeTeam = teams.find((t: { id: string }) => t.id === teamId)

  if (!org) return null

  // Team dashboard: static display showing org + team name
  if (isTeamRoute && activeTeam) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent">
            <Avatar className="size-8 rounded-lg">
              <AvatarImage src={org.logo ?? undefined} className="rounded-lg" />
              <AvatarFallback className="rounded-lg text-xs font-bold bg-sidebar-primary text-sidebar-primary-foreground">
                {activeTeam.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{org.name}</span>
              <span className="truncate text-xs">{activeTeam.name}</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Org switcher (admin/owner dashboard)
  const displayOrgs = organizations.filter((o) => o.id !== activeOrgId)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={org.logo ?? undefined} className="rounded-lg" />
                <AvatarFallback className="rounded-lg text-xs font-bold bg-sidebar-primary text-sidebar-primary-foreground">
                  {org.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{org.name}</span>
                <span className="truncate text-xs">Organization</span>
              </div>
              <CaretUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organizations
            </DropdownMenuLabel>
            {displayOrgs.map((o) => (
              <DropdownMenuItem
                key={o.id}
                onClick={() => { onSwitchOrg(o.id) }}
                className="gap-2 p-2"
              >
                <Avatar className="size-6 rounded-md">
                  <AvatarImage src={o.logo ?? undefined} className="rounded-md" />
                  <AvatarFallback className="rounded-md text-[10px] font-medium border">
                    {o.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {o.name}
              </DropdownMenuItem>
            ))}
            {displayOrgs.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => router.push("/add-organization")}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <PlusIcon className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                Add organization
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
