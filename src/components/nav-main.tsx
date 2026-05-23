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

interface NavItem {
  title: string
  url?: string
  icon: React.ComponentType<{ className?: string }>
  items?: { title: string; url: string }[]
}

function ownerItems(slug: string): NavItem[] {
  return [
    { title: "Dashboard", url: `/${slug}`, icon: House },
    {
      title: "OKRs", icon: Target,
      items: [
        { title: "Org OKRs", url: `/${slug}/okr` },
        { title: "Team OKRs", url: `/${slug}/okr/team` },
        { title: "Cycles", url: `/${slug}/okr/cycles` },
      ],
    },
    {
      title: "Knowledge Base", icon: BookBookmark,
      items: [
        { title: "View", url: `/${slug}/knowledge-base` },
        { title: "Add Knowledge", url: `/${slug}/knowledge-base/add` },
        { title: "Categories", url: `/${slug}/knowledge-base/categories` },
      ],
    },
    { title: "Teams", url: `/${slug}/teams`, icon: UsersThree },
    { title: "Members", url: `/${slug}/members`, icon: Users },
    {
      title: "Settings", icon: Gear,
      items: [
        { title: "General", url: `/${slug}/settings/general` },
        { title: "Billing", url: "#" },
      ],
    },
  ]
}

function leaderItems(slug: string): NavItem[] {
  return [
    { title: "Dashboard", url: `/${slug}/manage-team`, icon: House },
    {
      title: "OKRs", icon: Target,
      items: [
        { title: "Team OKR", url: `/${slug}/manage-team/okr` },
        { title: "Members OKR", url: `/${slug}/manage-team/okr/members` },
      ],
    },
    {
      title: "Knowledge Base", icon: BookBookmark,
      items: [
        { title: "View", url: `/${slug}/manage-team/knowledge-base` },
        { title: "Add Knowledge", url: `/${slug}/manage-team/knowledge-base/add` },
        { title: "Categories", url: `/${slug}/manage-team/knowledge-base/categories` },
        { title: "Trash", url: `/${slug}/manage-team/knowledge-base/trash` },
      ],
    },
    {
      title: "Tasks", icon: ListChecks,
      items: [
        { title: "My tasks", url: `/${slug}/manage-team/tasks` },
        { title: "All team tasks", url: `/${slug}/manage-team/tasks/all` },
      ],
    },
    { title: "Members", url: `/${slug}/manage-team/members`, icon: Users },
  ]
}

function memberItems(slug: string): NavItem[] {
  return [
    { title: "Dashboard", url: `/${slug}/team`, icon: House },
    {
      title: "OKRs", icon: Target,
      items: [
        { title: "My OKRs", url: `/${slug}/team/okr` },
      ],
    },
    {
      title: "Knowledge Base", icon: BookBookmark,
      items: [
        { title: "View", url: `/${slug}/team/knowledge-base` },
        { title: "Add Knowledge", url: `/${slug}/team/knowledge-base/add` },
        { title: "Categories", url: `/${slug}/team/knowledge-base/categories` },
      ],
    },
    {
      title: "Tasks", icon: ListChecks,
      items: [
        { title: "My tasks", url: `/${slug}/team/tasks` },
      ],
    },
    { title: "Members", url: `/${slug}/team/members`, icon: Users },
  ]
}

export function NavMain() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const slug = params.companySlug as string | undefined

  let branch: "owner" | "leader" | "member" = "owner"
  if (slug && pathname.startsWith(`/${slug}/manage-team`)) branch = "leader"
  else if (slug && (pathname === `/${slug}/team` || pathname.startsWith(`/${slug}/team/`))) branch = "member"

  const navItems = slug
    ? branch === "leader" ? leaderItems(slug)
      : branch === "member" ? memberItems(slug)
      : ownerItems(slug)
    : []

  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

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

  function handleNav(item: NavItem) {
    if (item.url) router.push(item.url)
  }

  function isItemActive(item: NavItem): boolean {
    if (item.items) {
      return item.items.some((sub) => pathname === sub.url)
    }
    return pathname === item.url
  }

  if (!slug) return null

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {navItems.map((item) => {
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
                  <SidebarMenuButton tooltip={item.title} isActive={isItemActive(item)} onClick={() => handleNav(item)}>
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
                      {item.items!.map((subItem) => (
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
