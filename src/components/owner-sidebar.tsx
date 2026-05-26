"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import {
  BookBookmark,
  Gear,
  House,
  ListChecks,
  Megaphone,
  Target,
  Users,
  UsersThree,
} from "@phosphor-icons/react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { OrgSwitcher } from "@/components/org-switcher"
import { NavUser } from "@/components/nav-user"
import { SidebarNavItems, type NavItem } from "@/components/sidebar-nav-items"
import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"

function ownerItems(
  slug: string,
  counts: { myTasks?: number; orgTasks?: number; assignedTasks?: number },
): NavItem[] {
  const d = (path: string) => `/${slug}/dashboard${path}`
  return [
    { title: "Dashboard", url: d(""), icon: House },
    { title: "Announcements", url: d("/announcements"), icon: Megaphone },
    {
      title: "OKRs",
      icon: Target,
      items: [
        { title: "Org OKRs", url: d("/okr") },
        { title: "Team OKRs", url: d("/okr/team") },
        { title: "Cycles", url: d("/okr/cycles") },
      ],
    },
    {
      title: "Tasks",
      icon: ListChecks,
      items: [
        { title: "My tasks", url: d("/tasks"), badge: counts.myTasks },
        {
          title: "Organization Tasks",
          url: d("/tasks/all"),
          badge: counts.orgTasks,
        },
        {
          title: "Assigned Tasks",
          url: d("/tasks/assigned"),
        },
      ],
    },
    {
      title: "Knowledge Base",
      icon: BookBookmark,
      items: [
        { title: "View", url: d("/knowledge-base") },
        { title: "Add Knowledge", url: d("/knowledge-base/add") },
        { title: "Categories", url: d("/knowledge-base/categories") },
      ],
    },
    { title: "Teams", url: d("/teams"), icon: UsersThree },
    { title: "Members", url: d("/members"), icon: Users },
    {
      title: "Settings",
      icon: Gear,
      items: [
        { title: "General", url: d("/settings/general") },
        { title: "Billing", url: "#" },
      ],
    },
  ]
}

export function OwnerSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const params = useParams()
  const slug = params.companySlug as string | undefined
  const { organization } = useOrganization()

  const { data: counts } = api.task.getSidebarCounts.useQuery(
    {
      organizationId: organization?.id ?? "",
      teamId: null,
      dashboard: "owner",
    },
    { enabled: !!organization },
  )

  const items = useMemo(
    () => (slug ? ownerItems(slug, counts ?? {}) : []),
    [slug, counts],
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrgSwitcher />
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
