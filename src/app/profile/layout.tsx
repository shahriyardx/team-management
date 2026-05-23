"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Devices, Key, ShieldCheck, LockKeyOpen, ArrowLeft } from "@phosphor-icons/react"
import { authClient } from "@/lib/auth-client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navItems = [
  { href: "/profile", label: "Profile", icon: User, exact: true },
  { href: "/profile/sessions", label: "Sessions", icon: Devices },
  { href: "/profile/passkeys", label: "Passkeys", icon: Key },
  { href: "/profile/password", label: "Password", icon: LockKeyOpen },
  { href: "/profile/two-fa", label: "Two-Factor", icon: ShieldCheck },
]

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session, isPending } = authClient.useSession()
  const user = session?.user

  return (
    <div className="flex flex-1">
      {/* Profile sidebar */}
      <aside className="w-56 shrink-0 border-r border-border bg-background p-4 flex flex-col gap-1">
        <div className="flex-1">
          {!isPending && user && (
            <div className="flex items-center gap-3 px-3 py-4 mb-2 border-b border-border">
              <Avatar className="size-8">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback className="text-xs">{user.name?.charAt(0)?.toUpperCase() ?? "U"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-none px-3 py-2 text-xs transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="border-t border-border pt-2 mt-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-none px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}
