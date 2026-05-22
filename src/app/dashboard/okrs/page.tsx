"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useOrganization } from "@/lib/organization-context"
import { useMemberRole } from "@/lib/use-member-role"
import { Skeleton } from "@/components/ui/skeleton"

export default function OkrsRedirectPage() {
  const router = useRouter()
  const { organization } = useOrganization()
  const { role, loading } = useMemberRole()

  useEffect(() => {
    if (loading || !organization || !role) return
    if (role === "owner" || role === "admin") {
      router.replace("/dashboard/okrs/org")
    }
  }, [role, loading, organization, router])

  if (loading || !organization) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
    </div>
  )
}

