"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { CaretUpDownIcon, SignOutIcon, User } from "@phosphor-icons/react"
import { authClient } from "@/lib/auth-client"
import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"

export function NavUser() {
  const router = useRouter()
  const { isMobile } = useSidebar()
  const { data: session } = authClient.useSession()
  const { organizations, organization: activeOrg, onSwitchOrg } = useOrganization()
  const utils = api.useUtils()
  const user = session?.user
  const [menuOpen, setMenuOpen] = useState(false)
  const [orgTeams, setOrgTeams] = useState<Record<string, Array<{ id: string; name: string }>>>({})

  // Fetch teams for all orgs when dropdown opens
  useEffect(() => {
    if (!menuOpen || organizations.length === 0) return
    let cancelled = false
    const fetchAll = async () => {
      const results: Record<string, Array<{ id: string; name: string }>> = {}
      for (const org of organizations) {
        try {
          const data = await utils.team.getMyTeams.fetch({ organizationId: org.id })
          results[org.id] = (data as { teams: Array<{ id: string; name: string }> }).teams ?? []
        } catch {
          results[org.id] = []
        }
        if (cancelled) return
      }
      setOrgTeams(results)
    }
    fetchAll()
    return () => { cancelled = true }
  }, [menuOpen, organizations, utils.team.getMyTeams])

  async function handleSignOut() {
    await authClient.signOut()
    router.replace("/")
  }

  async function handleSwitchOrg(orgId: string) {
    await onSwitchOrg(orgId)
  }

  if (!user) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.image ?? ""} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <CaretUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.image ?? ""} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organizations
            </DropdownMenuLabel>
            {organizations.map((org) => {
              const teams = orgTeams[org.id] ?? []
              const isActive = org.id === activeOrg?.id

              if (teams.length === 0) {
                return (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => handleSwitchOrg(org.id)}
                    className="gap-2 p-2"
                  >
                    <span className="flex size-6 items-center justify-center rounded-md border text-xs">
                      {org.name.charAt(0)}
                    </span>
                    <span className="flex-1">{org.name}</span>
                    {isActive && <span className="text-[10px] text-muted-foreground">(active)</span>}
                  </DropdownMenuItem>
                )
              }

              return (
                <DropdownMenuSub key={org.id}>
                  <DropdownMenuSubTrigger className="gap-2 p-2">
                    <span className="flex size-6 items-center justify-center rounded-md border text-xs">
                      {org.name.charAt(0)}
                    </span>
                    <span className="flex-1">{org.name}</span>
                    {isActive && <span className="text-[10px] text-muted-foreground">(active)</span>}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="min-w-40 rounded-lg">
                    {teams.map((team) => (
                      <DropdownMenuItem
                        key={team.id}
                        onClick={() => router.push(`/dashboard/team/${team.id}`)}
                        className="gap-2 p-2"
                      >
                        <span className="flex size-5 items-center justify-center rounded border text-[10px]">
                          {team.name.charAt(0)}
                        </span>
                        {team.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <SignOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
