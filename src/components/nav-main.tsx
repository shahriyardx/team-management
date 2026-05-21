"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
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
import { CaretRightIcon, BookBookmark, Gear, House, ListChecks, Users } from "@phosphor-icons/react"

const navItems = [
  {
    title: "Dashboard",
    icon: House,
    items: undefined as { title: string; url: string }[] | undefined,
  },
  {
    title: "Tasks",
    icon: ListChecks,
    items: [
      { title: "My tasks", url: "tasks" },
      { title: "All team tasks", url: "tasks/all" },
    ],
  },
  {
    title: "Knowledge Base",
    icon: BookBookmark,
    items: undefined,
  },
  {
    title: "Members",
    icon: Users,
    items: undefined,
  },
  {
    title: "Settings",
    icon: Gear,
    items: [
      { title: "General", url: "#" },
      { title: "Billing", url: "#" },
    ],
  },
]

export function NavMain() {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string | undefined

  function handleNav(title: string) {
    if (!slug) return
    switch (title) {
      case "Dashboard":
        router.push(`/dashboard/${slug}`)
        break
      case "Members":
        router.push(`/dashboard/${slug}/members`)
        break
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {navItems.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={false}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={item.title}
                  onClick={() => handleNav(item.title)}
                >
                  <item.icon />
                  <span>{item.title}</span>
                  {item.items && (
                    <CaretRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  )}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              {item.items && (
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <Link href={`/dashboard/${slug}/${subItem.url}`}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
