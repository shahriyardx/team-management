"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { BookBookmark, House, ListChecks, Megaphone, Target, Users } from "@phosphor-icons/react"
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
import { api } from "@/lib/trpc/client"
import type { authClient } from "@/lib/auth-client"

type Session = Awaited<ReturnType<typeof authClient.useSession>>["data"]

function memberItems(slug: string, todoCount: number): NavItem[] {
  return [
    { title: "Dashboard", url: `/${slug}/team`, icon: House },
    { title: "Announcements", url: `/${slug}/team/announcements`, icon: Megaphone },
    {
      title: "OKRs",
      icon: Target,
      items: [
        { title: "My OKRs", url: `/${slug}/team/okr` },
      ],
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
        { title: "My tasks", url: `/${slug}/team/tasks`, badge: todoCount },
        { title: "Assigned", url: `/${slug}/team/tasks/assigned` },
      ],
    },
    { title: "Members", url: `/${slug}/team/members`, icon: Users },
  ]
}

export function MemberSidebar({
  session: _session,
  ...props
}: React.ComponentProps<typeof Sidebar> & { session: Session }) {
  const params = useParams()
  const slug = params.companySlug as string | undefined
  const { organization } = useOrganization()
  const activeTeamId = _session?.session?.activeTeamId ?? null

  const { data: todoCountData } = api.task.getTodoCount.useQuery(
    { organizationId: organization?.id ?? "", teamId: activeTeamId },
    { enabled: !!organization },
  )
  const todoCount = todoCountData?.count ?? 0

  const items = useMemo(() => (slug ? memberItems(slug, todoCount) : []), [slug, todoCount])

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
