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
import type { authClient } from "@/lib/auth-client"

type Session = Awaited<ReturnType<typeof authClient.useSession>>["data"]

function ownerItems(
  slug: string,
  counts: { myTasks?: number; orgTasks?: number; assignedTasks?: number },
): NavItem[] {
  return [
    { title: "Dashboard", url: `/${slug}`, icon: House },
    { title: "Announcements", url: `/${slug}/announcements`, icon: Megaphone },
    {
      title: "OKRs",
      icon: Target,
      items: [
        { title: "Org OKRs", url: `/${slug}/okr` },
        { title: "Team OKRs", url: `/${slug}/okr/team` },
        { title: "Cycles", url: `/${slug}/okr/cycles` },
      ],
    },
    {
      title: "Tasks",
      icon: ListChecks,
      items: [
        { title: "My tasks", url: `/${slug}/tasks`, badge: counts.myTasks },
        {
          title: "Organization Tasks",
          url: `/${slug}/tasks/all`,
          badge: counts.orgTasks,
        },
        {
          title: "Assigned Tasks",
          url: `/${slug}/tasks/assigned`,
          badge: counts.assignedTasks,
        },
      ],
    },
    {
      title: "Knowledge Base",
      icon: BookBookmark,
      items: [
        { title: "View", url: `/${slug}/knowledge-base` },
        { title: "Add Knowledge", url: `/${slug}/knowledge-base/add` },
        { title: "Categories", url: `/${slug}/knowledge-base/categories` },
      ],
    },
    { title: "Teams", url: `/${slug}/teams`, icon: UsersThree },
    { title: "Members", url: `/${slug}/members`, icon: Users },
    {
      title: "Settings",
      icon: Gear,
      items: [
        { title: "General", url: `/${slug}/settings/general` },
        { title: "Billing", url: "#" },
      ],
    },
  ]
}

export function OwnerSidebar({
  session: _session,
  ...props
}: React.ComponentProps<typeof Sidebar> & { session: Session }) {
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
