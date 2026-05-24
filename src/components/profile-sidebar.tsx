"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { User, Devices, Key, ShieldCheck, LockKeyOpen } from "@phosphor-icons/react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ProfileNavUser } from "@/components/profile-nav-user"

const navItems = [
  { href: "/profile", label: "Profile", icon: User, exact: true },
  { href: "/profile/sessions", label: "Sessions", icon: Devices },
  { href: "/profile/passkeys", label: "Passkeys", icon: Key },
  { href: "/profile/password", label: "Password", icon: LockKeyOpen },
  { href: "/profile/two-fa", label: "Two-Factor", icon: ShieldCheck },
]

export function ProfileSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  const items = useMemo(
    () =>
      navItems.map((item) => ({
        ...item,
        active: item.exact ? pathname === item.href : pathname.startsWith(item.href),
      })),
    [pathname],
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Dashboard">
              <Link href="/dashboard" className="gap-2.5">
                <Image src="/logo.png" alt="WeirdTeams" width={28} height={28} className="size-7 shrink-0" />
                <span className="truncate text-base font-semibold">WeirdTeams</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={item.active} tooltip={item.label}>
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <ProfileNavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
