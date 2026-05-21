"use client"

import { useRouter } from "next/navigation"
import { CaretUpDownIcon, PlusIcon } from "@phosphor-icons/react"

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

export function TeamSwitcher({
  organizations,
  activeOrganizationId,
  onSwitchOrg,
}: {
  organizations: { id: string; name: string; slug: string; logo?: React.ReactNode }[]
  activeOrganizationId?: string
  onSwitchOrg: (orgId: string) => void
}) {
  const router = useRouter()
  const { isMobile } = useSidebar()

  const activeOrg = organizations.find((o) => o.id === activeOrganizationId) ?? organizations[0]
  const displayOrgs = organizations.filter((o) => o.id !== activeOrganizationId)

  if (!activeOrg) return null

  const logo = activeOrg.logo ?? (
    <span className="flex size-4 items-center justify-center text-xs font-bold">
      {activeOrg.name.charAt(0).toUpperCase()}
    </span>
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {logo}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeOrg.name}</span>
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
            {displayOrgs.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => onSwitchOrg(org.id)}
                className="gap-2 p-2"
              >
                <span className="flex size-6 items-center justify-center rounded-md border text-xs">
                  {org.name.charAt(0)}
                </span>
                {org.name}
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
