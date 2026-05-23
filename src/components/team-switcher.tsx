"use client"

import { useRouter, useParams, usePathname } from "next/navigation"
import { CaretUpDownIcon, PlusIcon } from "@phosphor-icons/react"
import { useOrganization } from "@/lib/organization-context"
import { authClient } from "@/lib/auth-client"
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
  const slug = params.companySlug as string | undefined
  const activeTeamId = session?.session?.activeTeamId

  let branch: "owner" | "leader" | "member" = "owner"
  if (slug && pathname.startsWith(`/${slug}/manage-team`)) branch = "leader"
  else if (slug && (pathname === `/${slug}/team` || pathname.startsWith(`/${slug}/team/`))) branch = "member"

  const isTeamBranch = branch === "leader" || branch === "member"

  const activeOrgId = session?.session?.activeOrganizationId ?? undefined
  const org = activeOrg ?? organizations.find((o) => o.id === activeOrgId) ?? organizations[0]

  const { data: myTeamsData } = api.team.getMyTeams.useQuery(
    { organizationId: org?.id ?? "" },
    { enabled: !!org && isTeamBranch },
  )
  const teams = (myTeamsData as { teams?: Array<{ id: string; name: string }> } | undefined)?.teams ?? []
  const activeTeam = teams.find((t) => t.id === activeTeamId)

  async function handleSwitchTeam(teamId: string) {
    await authClient.organization.setActiveTeam({ teamId })
    router.refresh()
  }

  async function handleSwitchOrg(newOrgId: string) {
    const newOrg = organizations.find((o) => o.id === newOrgId)
    if (!newOrg) return
    await onSwitchOrg(newOrgId)
    router.push(`/${newOrg.slug}`)
  }

  if (!org) return null

  // Team branch: org + team name with team switcher
  if (isTeamBranch) {
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
                    {(activeTeam?.name ?? org.name).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{org.name}</span>
                  <span className="truncate text-xs">{activeTeam?.name ?? "No team"}</span>
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
                Teams
              </DropdownMenuLabel>
              {teams.map((team) => (
                <DropdownMenuItem
                  key={team.id}
                  onClick={() => handleSwitchTeam(team.id)}
                  className="gap-2 p-2"
                >
                  <Avatar className="size-6 rounded-md">
                    <AvatarFallback className="rounded-md text-[10px] font-medium border">
                      {team.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm">{team.name}</span>
                  </div>
                  {team.id === activeTeamId && <span className="text-[10px] text-muted-foreground shrink-0">(active)</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Owner branch: org switcher
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
                onClick={() => handleSwitchOrg(o.id)}
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
              onClick={() => router.push("/onboard/add-organization")}
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
