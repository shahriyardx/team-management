"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
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
                {link.label}
              </Link>
            )
          })}
        </nav>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/onboard">
              Get started
              <ArrowRight className="size-3" />
            </Link>
          </Button>
          <LandingNav />
        </div>
      </div>
    </header>
  )
}
