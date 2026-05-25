"use client"

import { useState, useEffect } from "react"
import { keepPreviousData } from "@tanstack/react-query"
import { format } from "date-fns"
import { useRouter, useParams, usePathname } from "next/navigation"
import {
  ChatDots,
  Heart,
  Megaphone,
  PushPinSimple,
  MagnifyingGlass,
} from "@phosphor-icons/react"
import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AnnouncementItem } from "./types"

interface Props {
  scope?: "org" | "team"
  showScopeToggle?: boolean
  defaultScope?: "org" | "team"
}

const PAGE_SIZE = 20

export function AnnouncementList({ scope, showScopeToggle }: Props) {
  const { organization } = useOrganization()
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const slug = params.companySlug as string
  const basePath = pathname.replace(/\/+$/, "")
  const isMemberView = pathname.startsWith(`/${slug}/team`)

  const [scopeFilter, setScopeFilter] = useState<"org" | "team">(defaultScope ?? "org")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const activeScope = scope ?? scopeFilter

  const {
    data,
    isLoading,
    isFetching,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = api.announcement.list.useInfiniteQuery(
    {
      organizationId: organization?.id ?? "",
      scope: activeScope,
      search: debouncedSearch || undefined,
      take: PAGE_SIZE,
    },
    {
      enabled: !!organization,
      placeholderData: keepPreviousData,
      getNextPageParam: (lastPage, allPages) => {
        if (!lastPage.hasMore) return undefined
        return allPages.length * PAGE_SIZE
      },
    },
  )

  const announcements = (data?.pages.flatMap((p) => p.announcements) ??
    []) as AnnouncementItem[]

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">Announcements</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Company and team updates.
          </p>
        </div>
        {!isMemberView && (
          <Button size="sm" onClick={() => router.push(`${basePath}/create`)}>
            <Megaphone className="mr-1 size-3.5" />
            New
          </Button>
        )}
      </div>

      {showScopeToggle && (
        <div className="flex items-center gap-1 border border-border p-0.5 w-fit">
          <button
            type="button"
            onClick={() => setScopeFilter("org")}
            className={`px-3 py-1 text-xs transition-colors ${
              scopeFilter === "org"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Organization
          </button>
          <button
            type="button"
            onClick={() => setScopeFilter("team")}
            className={`px-3 py-1 text-xs transition-colors ${
              scopeFilter === "team"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Team
          </button>
        </div>
      )}

      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search announcements..."
          className="h-9 pl-8 text-xs rounded-none"
        />
      </div>

      {isFetching && !isLoading && (
        <p className="text-[11px] text-muted-foreground -mt-4">Searching...</p>
      )}

      {announcements.length === 0 ? (
        <div className="border border-border p-8 text-center text-xs text-muted-foreground">
          {debouncedSearch
            ? "No announcements match your search."
            : "No announcements yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <button
              key={a.id}
              onClick={() => router.push(`${basePath}/${a.id}`)}
              className="w-full text-left border border-border p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                {a.thumbnailUrl && (
                  <img
                    src={a.thumbnailUrl}
                    alt=""
                    className="w-full sm:w-24 h-48 sm:h-16 object-cover rounded-none shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {a.pinned && (
                      <PushPinSimple className="size-3 text-muted-foreground shrink-0" />
                    )}
                    <h3 className="text-sm font-medium truncate">{a.title}</h3>
                    {a.team && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {a.team.name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                    {a.content.replace(/[#*`>[\]]/g, "").slice(0, 200)}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span>{a.author.name}</span>
                    <span>{format(new Date(a.createdAt), "MMM d, yyyy")}</span>
                    <span className="flex items-center gap-1">
                      <Heart
                        className="size-2.5"
                        weight={a.liked ? "fill" : "regular"}
                      />
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

      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  )
}
