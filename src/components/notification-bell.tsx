"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, usePathname, useRouter } from "next/navigation"
import { Bell } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"

function kbBase(slug: string, pathname: string, teamId?: string | null) {
  if (teamId) {
    if (pathname.includes("/manage-team/")) return `/${slug}/manage-team/knowledge-base`
    if (pathname.includes("/co-leader/")) return `/${slug}/co-leader/knowledge-base`
    return `/${slug}/team/knowledge-base`
  }
  if (pathname.includes("/dashboard/")) return `/${slug}/dashboard/knowledge-base`
  return `/${slug}/knowledge-base`
}

function announcementBase(slug: string, pathname: string) {
  if (pathname.includes("/manage-team/")) return `/${slug}/manage-team/announcements`
  if (pathname.includes("/co-leader/")) return `/${slug}/co-leader/announcements`
  if (pathname === `/${slug}/team` || pathname.startsWith(`/${slug}/team/`))
    return `/${slug}/team/announcements`
  if (pathname.includes("/dashboard/")) return `/${slug}/dashboard/announcements`
  return `/${slug}/announcements`
}

function navigateToNotification(
  n: {
    kbItem?: { id: string; teamId?: string | null } | null
    announcement?: { id: string } | null
    task?: { id: string } | null
  },
  slug: string,
  pathname: string,
  router: ReturnType<typeof useRouter>,
) {
  if (n.kbItem) {
    router.push(`${kbBase(slug, pathname, n.kbItem.teamId)}/${n.kbItem.id}`)
  } else if (n.announcement) {
    router.push(`${announcementBase(slug, pathname)}/${n.announcement.id}`)
  }
}

function NotificationRow({
  n,
  slug,
  pathname,
  router,
  onDone,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: notifications shape varies
  n: any
  slug: string
  pathname: string
  router: ReturnType<typeof useRouter>
  onDone: () => void
}) {
  return (
    <button
      key={n.id}
      onClick={() => {
        onDone()
        navigateToNotification(n, slug, pathname, router)
      }}
      className="w-full border-b border-border px-3 py-2 text-left transition-colors hover:bg-accent last:border-b-0"
    >
      <p className="text-xs font-medium text-foreground">{n.title}</p>
      {n.body && (
        <p className="mt-0.5 text-[10px] text-muted-foreground">{n.body}</p>
      )}
    </button>
  )
}

export function NotificationBell() {
  const { organization } = useOrganization()
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const slug = params.companySlug as string | undefined

  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data, refetch } = api.notification.listUnread.useQuery(
    { organizationId: organization?.id ?? "" },
    { enabled: !!organization, refetchInterval: 30_000 },
  )
  const notifications = data?.notifications ?? []
  const totalUnread = data?.total ?? 0

  const { data: allData } = api.notification.listAll.useQuery(
    { organizationId: organization?.id ?? "" },
    { enabled: dialogOpen && !!organization },
  )
  const allNotifications = allData?.notifications ?? []

  const markReadMutation = api.notification.markRead.useMutation({
    onSuccess: () => refetch(),
  })
  const markAllReadMutation = api.notification.markAllRead.useMutation({
    onSuccess: () => {
      refetch()
      setDialogOpen(false)
    },
  })

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const unreadBadge = totalUnread > 9 ? "9+" : totalUnread || ""

  return (
    <>
      <div ref={ref} className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => setOpen(!open)}
        >
          <Bell className="size-4" />
          {totalUnread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-destructive text-[8px] font-medium text-destructive-foreground">
              {unreadBadge}
            </span>
          )}
        </Button>
        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-none border border-border bg-popover text-popover-foreground shadow-md">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-xs font-medium">Notifications</span>
              {totalUnread > 0 && (
                <button
                  onClick={() =>
                    markAllReadMutation.mutate({
                      organizationId: organization?.id ?? "",
                    })
                  }
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No notifications
                </p>
              ) : (
                notifications.map((n) => (
                  <NotificationRow
                    key={n.id}
                    n={n}
                    slug={slug!}
                    pathname={pathname}
                    router={router}
                    onDone={() => {
                      markReadMutation.mutate({ id: n.id })
                      setOpen(false)
                    }}
                  />
                ))
              )}
            </div>
            {totalUnread > 5 && (
              <button
                onClick={() => {
                  setOpen(false)
                  setDialogOpen(true)
                }}
                className="w-full border-t border-border px-3 py-2 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-center"
              >
                Show all ({totalUnread})
              </button>
            )}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm">Notifications</DialogTitle>
          </DialogHeader>
          {allNotifications.length > 0 && (
            <div className="px-0">
              <button
                onClick={() =>
                  markAllReadMutation.mutate({
                    organizationId: organization?.id ?? "",
                  })
                }
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                Mark all read
              </button>
            </div>
          )}
          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            {allNotifications.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No notifications
              </p>
            ) : (
              allNotifications.map((n) => (
                <NotificationRow
                  key={n.id}
                  n={n}
                  slug={slug!}
                  pathname={pathname}
                  router={router}
                  onDone={() => {
                    markReadMutation.mutate({ id: n.id })
                    setDialogOpen(false)
                  }}
                />
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
