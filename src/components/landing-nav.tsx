"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/trpc/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SignOut, User } from "@phosphor-icons/react"

type Org = { id: string; name: string; slug: string; logo?: string | null }

export function LandingNav() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const user = session?.user
  const [orgs, setOrgs] = useState<Org[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const utils = api.useUtils()

  useEffect(() => {
    if (!session) return
    utils.member.listActiveOrganizations.fetch().then(({ organizations }) => {
      setOrgs(organizations)
    })
  }, [session, utils])

  async function handleSignOut() {
    await authClient.signOut()
    router.replace("/")
  }

  async function handleOrgClick(org: Org) {
    await authClient.organization.setActive({ organizationId: org.id })
    const { data: member } = await authClient.organization.getActiveMember()
    const role =
      member && typeof member === "object" && "role" in member
        ? (member as { role: string }).role
        : null
    if (role === "owner" || role === "admin") router.push(`/${org.slug}`)
    else router.push(`/${org.slug}/team`)
  }

  if (isPending)
    return (
      <span className="size-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
    )

  if (!user) {
    return (
      <Link href="/auth/login">
        <span className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Sign in
        </span>
      </Link>
    )
  }

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <button className="rounded-md p-0.5 hover:bg-accent transition-colors">
          <Avatar className="size-8">
            <AvatarImage src={user.image ?? ""} alt={user.name} />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-lg"
        align="end"
        sideOffset={8}
      >
        <div className="px-2 py-1.5 text-left text-sm">
          <div className="truncate font-medium text-foreground">
            {user.name}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {user.email}
          </div>
        </div>
        <DropdownMenuSeparator />
        {orgs.length === 0 && (
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            No organizations
          </DropdownMenuItem>
        )}
        {orgs.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleOrgClick(org)}
            className="gap-2 p-2"
          >
            <span className="flex size-6 items-center justify-center rounded-md border text-xs">
              {org.name.charAt(0)}
            </span>
            <span className="flex-1">{org.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <User />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <SignOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
