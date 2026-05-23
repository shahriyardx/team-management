"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { LandingNav } from "@/components/landing-nav"
import { SiteLogo } from "@/components/site-logo"

const links = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
]

export function PublicHeader() {
  const pathname = usePathname()
  const { data: session } = authClient.useSession()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5 sm:px-8">
        <div className="flex items-center gap-8">
          <SiteLogo />
          <nav className="hidden md:flex items-center gap-5">
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                [{link.label}]
              </Link>
            )
          })}
        </nav>
        </div>
        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <Link
                href="/auth/register"
                className="hidden sm:inline-flex h-8 items-center gap-1 rounded-md bg-foreground px-4 text-xs font-semibold text-background hover:bg-foreground/90 transition-colors"
              >
                Get started
                <ArrowRight className="size-3" />
              </Link>
              <LandingNav />
            </>
          ) : (
            <LandingNav />
          )}
        </div>
      </div>
    </header>
  )
}
