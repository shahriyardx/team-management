"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, usePathname, useRouter } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { CaretRightIcon, BookBookmark, Gear, House, ListChecks, Target, Users, UsersThree } from "@phosphor-icons/react"
import { useMemberRole, type EffectiveRole } from "@/lib/use-member-role"

interface NavItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  roles: EffectiveRole[]
  items?: { title: string; url: string; roles: EffectiveRole[] }[]
}

const baseNavItems: NavItem[] = [
  { title: "Dashboard", icon: House, roles: ["owner", "admin", "team_leader", "member", "pending"] },
  { title: "Teams", icon: UsersThree, roles: ["owner", "admin"] },
  { title: "Knowledge Base", icon: BookBookmark, roles: ["team_leader", "member"] },
  { title: "Members", icon: Users, roles: ["owner", "admin", "team_leader", "member"] },
  {
    title: "Settings",
    icon: Gear,
    roles: ["owner", "admin"],
    items: [
      { title: "General", url: "#", roles: ["owner", "admin"] },
      { title: "Billing", url: "#", roles: ["owner", "admin"] },
    ],
  },
]

function getTasksItem(teamId?: string): NavItem | null {
  if (!teamId) return null
  return {
    title: "Tasks",
    icon: ListChecks,
    roles: ["team_leader", "member"],
    items: [
      { title: "My tasks", url: `/dashboard/team/${teamId}/tasks`, roles: ["team_leader", "member"] },
      { title: "All team tasks", url: `/dashboard/team/${teamId}/tasks/all`, roles: ["team_leader", "member"] },
    ],
  }
}

function getOkrItem(role: EffectiveRole | null, teamId?: string): NavItem | null {
  if (!role || role === "pending") return null

  if (role === "owner" || role === "admin") {
    return {
      title: "OKRs",
      icon: Target,
      roles: ["owner", "admin"],
      items: [
        { title: "Org OKRs", url: "/dashboard/okrs/org", roles: ["owner", "admin"] },
        { title: "Team OKRs", url: "/dashboard/okrs/team", roles: ["owner", "admin"] },
        { title: "Cycles", url: "/dashboard/okrs/cycles", roles: ["owner", "admin"] },
      ],
    }
  }

  if (role === "team_leader" && teamId) {
    return {
      title: "OKRs",
      icon: Target,
      roles: ["team_leader"],
      items: [
        { title: "Team OKR", url: `/dashboard/team/${teamId}/okrs/team`, roles: ["team_leader"] },
        { title: "Members OKR", url: `/dashboard/team/${teamId}/okrs/members`, roles: ["team_leader"] },
      ],
    }
  }

  if (role === "member" && teamId) {
    return {
      title: "OKRs",
      icon: Target,
      roles: ["member"],
      items: [
        { title: "My OKRs", url: `/dashboard/team/${teamId}/okrs`, roles: ["member"] },
      ],
    }
  }

  return { title: "OKRs", icon: Target, roles: [role] }
}

export function NavMain() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const { role, loading } = useMemberRole()
  const teamId = params?.teamId as string | undefined

  const okrItem = getOkrItem(role ?? null, teamId)
  const tasksItem = getTasksItem(teamId)

  let navItems: NavItem[] = [...baseNavItems]
  if (tasksItem) navItems.push(tasksItem)
  if (okrItem) navItems.push(okrItem)

  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  // Auto-open collapsible when navigating to a sub-item page
  useEffect(() => {
    setOpenItems((prev) => {
      const next = { ...prev }
      for (const item of navItems) {
        if (item.items?.some((sub) => pathname === sub.url)) {
          next[item.title] = true
        }
      }
      return next
    })
  }, [pathname])

  function handleNav(title: string) {
    switch (title) {
      case "Dashboard": router.push("/dashboard"); break
      case "Members": {
        if (teamId && (role === "team_leader" || role === "member")) {
          router.push(`/dashboard/team/${teamId}/members`)
        } else {
          router.push("/dashboard/members")
        }
        break
      }
      case "Teams":     router.push("/dashboard/teams"); break
    }
  }

  function isItemActive(item: NavItem): boolean {
    if (item.items) {
      // Items with sub-items: active when any sub URL matches
      return item.items.some((sub) => pathname === sub.url)
    }
    // Items without sub-items: direct path match
    switch (item.title) {
      case "Dashboard": return pathname === "/dashboard"
      case "Teams": return pathname === "/dashboard/teams" || pathname.startsWith("/dashboard/team/")
      case "Members": {
        if (teamId && (role === "team_leader" || role === "member")) {
          return pathname === `/dashboard/team/${teamId}/members`
        }
        return pathname === "/dashboard/members"
      }
      default: return false
    }
  }

  const visible = role
    ? navItems.filter((item) => item.roles.includes(role))
    : loading ? [] : navItems

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {visible.map((item) => {
          const hasSubItems = !!item.items
          const isOpen = openItems[item.title] ?? false

          return (
            <Collapsible
              key={item.title}
              asChild
              open={hasSubItems ? isOpen : undefined}
              onOpenChange={hasSubItems ? (open) => setOpenItems((prev) => ({ ...prev, [item.title]: open })) : undefined}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title} isActive={isItemActive(item)} onClick={() => handleNav(item.title)}>
                    <item.icon />
                    <span>{item.title}</span>
                    {hasSubItems && (
                      <CaretRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                {hasSubItems && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items!
                        .filter((sub) => sub.roles.includes(role ?? "member"))
                        .map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                              <Link href={subItem.url}>{subItem.title}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
