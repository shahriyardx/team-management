"use client"

import { useState } from "react"
import { format } from "date-fns"
import { useRouter, useParams, usePathname } from "next/navigation"
import { ChatDots, Heart, Megaphone, PushPinSimple } from "@phosphor-icons/react"
import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { AnnouncementItem } from "./types"

export function AnnouncementList() {
  const { organization } = useOrganization()
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const slug = params.companySlug as string
  // Derive announcement base path from current route
  const basePath = pathname.replace(/\/+$/, "")
  const isMemberView = pathname.startsWith(`/${slug}/team`)

  const { data, isLoading } = api.announcement.list.useQuery(
    { organizationId: organization?.id ?? "" },
    { enabled: !!organization },
  )
  const announcements = (data?.announcements ?? []) as AnnouncementItem[]

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">Announcements</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Company and team updates.</p>
        </div>
        {!isMemberView && (
          <Button size="sm" onClick={() => router.push(`${basePath}/create`)}>
            <Megaphone className="mr-1 size-3.5" />
            New
          </Button>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="border border-border p-8 text-center text-xs text-muted-foreground">
          No announcements yet.
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <button
              key={a.id}
              onClick={() => router.push(`${basePath}/${a.id}`)}
              className="w-full text-left border border-border p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                {a.thumbnail && (
                  <img
                    src={a.thumbnail}
                    alt=""
                    className="size-16 object-cover rounded-none shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {a.pinned && <PushPinSimple className="size-3 text-muted-foreground shrink-0" />}
                    <h3 className="text-sm font-medium truncate">{a.title}</h3>
                    {a.team && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {a.team.name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                    {a.content.replace(/[#*`>\[\]]/g, "").slice(0, 200)}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span>{a.author.name}</span>
                    <span>{format(new Date(a.createdAt), "MMM d, yyyy")}</span>
                    <span className="flex items-center gap-1">
                      <Heart className="size-2.5" weight={a.liked ? "fill" : "regular"} />
                      {a._count.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <ChatDots className="size-2.5" />
                      {a._count.comments}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
