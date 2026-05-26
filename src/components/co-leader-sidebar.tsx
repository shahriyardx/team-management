"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowsLeftRight,
  BookBookmark,
  House,
  ListChecks,
  Megaphone,
  Target,
  Users,
} from "@phosphor-icons/react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { TeamSwitcher } from "@/components/team-switcher"
import { NavUser } from "@/components/nav-user"
import { SidebarNavItems, type NavItem } from "@/components/sidebar-nav-items"
import { useOrganization } from "@/lib/organization-context"
import { useMemberRole } from "@/lib/use-member-role"
import { api } from "@/lib/trpc/client"

function coLeaderItems(
  slug: string,
  counts: {
    myTasks?: number
    orgTasks?: number
    teamTasks?: number
    assignedTasks?: number
  },
): NavItem[] {
  return [
    { title: "Dashboard", url: `/${slug}/co-leader`, icon: House },
    {
      title: "Announcements",
      url: `/${slug}/co-leader/announcements`,
      icon: Megaphone,
    },
    {
      title: "Members",
      url: `/${slug}/co-leader/members`,
      icon: Users,
    },
    {
      title: "OKRs",
      icon: Target,
      items: [{ title: "My OKRs", url: `/${slug}/co-leader/okr` }],
    },
    {
      title: "Knowledge Base",
      icon: BookBookmark,
      items: [
        { title: "View", url: `/${slug}/co-leader/knowledge-base` },
        {
          title: "Add Knowledge",
          url: `/${slug}/co-leader/knowledge-base/add`,
        },
        {
          title: "Categories",
          url: `/${slug}/co-leader/knowledge-base/categories`,
        },
        { title: "Trash", url: `/${slug}/co-leader/knowledge-base/trash` },
      ],
    },
    {
      title: "Tasks",
      icon: ListChecks,
      items: [
        {
          title: "My tasks",
          url: `/${slug}/co-leader/tasks`,
          badge: counts.myTasks,
        },
        {
          title: "Organization Tasks",
          url: `/${slug}/co-leader/tasks/org`,
          badge: counts.orgTasks,
        },
        {
          title: "Team Tasks",
          url: `/${slug}/co-leader/tasks/all`,
          badge: counts.teamTasks,
        },
        {
          title: "Assigned Tasks",
          url: `/${slug}/co-leader/tasks/assigned`,
        },
      ],
    },
  ]
}

export function CoLeaderSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const params = useParams()
  const slug = params.companySlug as string | undefined
  const { organization, session } = useOrganization()
  const { role } = useMemberRole()
  const activeTeamId = session?.session?.activeTeamId ?? null

  const { data: counts } = api.task.getSidebarCounts.useQuery(
    {
      organizationId: organization?.id ?? "",
      teamId: activeTeamId,
      dashboard: "leader",
    },
    { enabled: !!organization },
  )

  const items = useMemo(() => {
    if (!slug) return []
    const base = coLeaderItems(slug, counts ?? {})
    if (role === "owner" || role === "admin") {
      base.unshift({ title: "Organization", url: `/${slug}`, icon: ArrowLeft })
    }
    return base
  }, [slug, counts, role])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-1.5 pb-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              className="cursor-default text-amber-600 dark:text-amber-400 text-[10px] font-semibold uppercase tracking-wider opacity-80 hover:bg-transparent"
              isActive={false}
            >
              Co-leader Dashboard
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu className="px-1.5 pb-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Team Dashboard"
              className="border border-dashed border-amber-400/40 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 data-[active=true]:bg-amber-50 dark:data-[active=true]:bg-amber-950/40 text-xs"
            >
              <a href={`/${slug}/team`}>
                <ArrowsLeftRight className="size-3.5" />
                <span>Team Dashboard</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarNavItems items={items} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
