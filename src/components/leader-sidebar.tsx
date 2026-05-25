"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
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
  SidebarRail,
} from "@/components/ui/sidebar"
import { TeamSwitcher } from "@/components/team-switcher"
import { NavUser } from "@/components/nav-user"
import { SidebarNavItems, type NavItem } from "@/components/sidebar-nav-items"
import { useOrganization } from "@/lib/organization-context"
import { useMemberRole } from "@/lib/use-member-role"
import { api } from "@/lib/trpc/client"
import type { authClient } from "@/lib/auth-client"

type Session = Awaited<ReturnType<typeof authClient.useSession>>["data"]

function leaderItems(
  slug: string,
  counts: {
    myTasks?: number
    orgTasks?: number
    teamTasks?: number
    assignedTasks?: number
  },
): NavItem[] {
  return [
    { title: "Dashboard", url: `/${slug}/manage-team`, icon: House },
    {
      title: "Announcements",
      url: `/${slug}/manage-team/announcements`,
      icon: Megaphone,
    },
    {
      title: "OKRs",
      icon: Target,
      items: [
        { title: "Team OKR", url: `/${slug}/manage-team/okr` },
        { title: "Members OKR", url: `/${slug}/manage-team/okr/members` },
      ],
    },
    {
      title: "Knowledge Base",
      icon: BookBookmark,
      items: [
        { title: "View", url: `/${slug}/manage-team/knowledge-base` },
        {
          title: "Add Knowledge",
          url: `/${slug}/manage-team/knowledge-base/add`,
        },
        {
          title: "Categories",
          url: `/${slug}/manage-team/knowledge-base/categories`,
        },
        { title: "Trash", url: `/${slug}/manage-team/knowledge-base/trash` },
      ],
    },
    {
      title: "Tasks",
      icon: ListChecks,
      items: [
        {
          title: "My tasks",
          url: `/${slug}/manage-team/tasks`,
          badge: counts.myTasks,
        },
        {
          title: "Organization Tasks",
          url: `/${slug}/manage-team/tasks/org`,
          badge: counts.orgTasks,
        },
        {
          title: "Team Tasks",
          url: `/${slug}/manage-team/tasks/all`,
          badge: counts.teamTasks,
        },
        {
          title: "Assigned Tasks",
          url: `/${slug}/manage-team/tasks/assigned`,
          badge: counts.assignedTasks,
        },
      ],
    },
    { title: "Members", url: `/${slug}/manage-team/members`, icon: Users },
  ]
}

export function LeaderSidebar({
  session: _session,
  ...props
}: React.ComponentProps<typeof Sidebar> & { session: Session }) {
  const params = useParams()
  const slug = params.companySlug as string | undefined
  const { organization } = useOrganization()
  const { role } = useMemberRole()
  const activeTeamId = _session?.session?.activeTeamId ?? null

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
    const base = leaderItems(slug, counts ?? {})
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
        <SidebarNavItems items={items} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
