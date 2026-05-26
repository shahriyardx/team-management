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

function memberItems(
  slug: string,
  counts: { myTasks?: number; assignedTasks?: number },
): NavItem[] {
  return [
    { title: "Dashboard", url: `/${slug}/team`, icon: House },
    {
      title: "Announcements",
      url: `/${slug}/team/announcements`,
      icon: Megaphone,
    },
    {
      title: "OKRs",
      icon: Target,
      items: [{ title: "My OKRs", url: `/${slug}/team/okr` }],
    },
    {
      title: "Knowledge Base",
      icon: BookBookmark,
      items: [
        { title: "View", url: `/${slug}/team/knowledge-base` },
        { title: "Add Knowledge", url: `/${slug}/team/knowledge-base/add` },
        { title: "Categories", url: `/${slug}/team/knowledge-base/categories` },
      ],
    },
    {
      title: "Tasks",
      icon: ListChecks,
      items: [
        { title: "My tasks", url: `/${slug}/team/tasks`, badge: counts.myTasks },
        {
          title: "Assigned Tasks",
          url: `/${slug}/team/tasks/assigned`,
        },
      ],
    },
    { title: "Members", url: `/${slug}/team/members`, icon: Users },
  ]
}

export function MemberSidebar({
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
      dashboard: "member",
    },
    { enabled: !!organization },
  )

  const { data: teamRole } = api.team.getMyTeamRole.useQuery(
    { teamId: activeTeamId ?? "" },
    { enabled: !!activeTeamId },
  )
  const isCoLeader = teamRole?.role === "co-leader"

  const items = useMemo(() => {
    if (!slug) return []
    const base = memberItems(slug, counts ?? {})
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
        {isCoLeader && (
          <SidebarMenu className="px-1.5 pb-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Co-leader Dashboard"
                className="border border-dashed border-blue-400/40 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 data-[active=true]:bg-blue-50 dark:data-[active=true]:bg-blue-950/40 text-xs"
              >
                <a href={`/${slug}/co-leader`}>
                  <ArrowsLeftRight className="size-3.5" />
                  <span>Co-leader Dashboard</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <SidebarNavItems items={items} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
