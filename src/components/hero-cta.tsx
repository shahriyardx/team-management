"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"

export function HeroCta() {
  const { data: session } = authClient.useSession()

  return (
    <div className="mt-10 flex items-center gap-3 sm:gap-4">
      <Button asChild className="h-11 px-7 text-sm">
        <Link href="/onboard">
          Get started free
          <ArrowRight className="size-4" />
        </Link>
      </Button>
      {!session?.user && (
        <Button asChild variant="outline" className="h-11 px-7 text-sm">
          <Link href="/auth/login">Sign in</Link>
        </Button>
      )}
    </div>
  )
}
