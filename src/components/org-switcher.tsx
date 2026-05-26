"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { CaretUpDownIcon, PlusIcon } from "@phosphor-icons/react"
import { useOrganization } from "@/lib/organization-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

function OrgLogo({
  src,
  name,
  className,
}: {
  src?: string | null
  name: string
  className?: string
}) {
  return (
    <div
      className={`overflow-hidden flex items-center justify-center shrink-0 ${className ?? ""}`}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={32}
          height={32}
          className="object-cover size-full"
        />
      ) : (
        <span className="flex size-full items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )
}

export function OrgSwitcher() {
  const router = useRouter()
  const { isMobile } = useSidebar()
  const {
    organizations,
    organization: activeOrg,
    onSwitchOrg,
  } = useOrganization()

  const org = activeOrg ?? organizations[0]
  if (!org) return null

  const displayOrgs = organizations.filter((o) => o.id !== org.id)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <OrgLogo
                src={org.logo}
                name={org.name}
                className="size-8 rounded-lg"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{org.name}</span>
              </div>
              <CaretUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organizations
            </DropdownMenuLabel>
            {displayOrgs.map((o) => (
              <DropdownMenuItem
                key={o.id}
                onClick={() =>
                  onSwitchOrg(o.id).then(() => router.push(`/${o.slug}`))
                }
                className="gap-2 p-2"
              >
                <OrgLogo
                  src={o.logo}
                  name={o.name}
                  className="size-6 rounded-md"
                />
                {o.name}
              </DropdownMenuItem>
            ))}
            {displayOrgs.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => router.push("/onboard/add-organization")}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <PlusIcon className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                Add organization
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
