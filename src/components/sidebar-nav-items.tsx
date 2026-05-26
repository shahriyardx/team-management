"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { CaretRightIcon } from "@phosphor-icons/react"
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

export interface NavItem {
  title: string
  url?: string
  icon: React.ComponentType<{ className?: string }>
  items?: { title: string; url: string; badge?: number }[]
}

export function SidebarNavItems({
  items,
  label,
}: {
  items: NavItem[]
  label?: string
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setOpenItems((prev) => {
      const next = { ...prev }
      for (const item of items) {
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
    if (item.items) return item.items.some((sub) => pathname === sub.url)
    return pathname === item.url
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label ?? "Platform"}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasSubItems = !!item.items
          const isOpen = openItems[item.title] ?? false

          return (
            <Collapsible
              key={item.title}
              asChild
              open={hasSubItems ? isOpen : undefined}
              onOpenChange={
                hasSubItems
                  ? (open) =>
                      setOpenItems((prev) => ({ ...prev, [item.title]: open }))
                  : undefined
              }
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isItemActive(item)}
                    onClick={() => handleNav(item)}
                  >
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
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === subItem.url}
                          >
                            <Link href={subItem.url}>
                              {subItem.title}
                              {subItem.badge ? (
                                <span className="ml-auto flex size-4 items-center justify-center rounded-full bg-foreground text-[9px] font-medium text-background">
                                  {subItem.badge > 9 ? "9+" : subItem.badge}
                                </span>
                              ) : null}
                            </Link>
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
