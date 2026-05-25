"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, usePathname, useRouter } from "next/navigation"
import { Bell } from "@phosphor-icons/react"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  OrganizationProvider,
  useOrganization,
} from "@/lib/organization-context"
import { OwnerSidebar } from "@/components/owner-sidebar"
import { LeaderSidebar } from "@/components/leader-sidebar"
import { MemberSidebar } from "@/components/member-sidebar"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/trpc/client"

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
    const base = n.kbItem.teamId
      ? pathname.includes("/manage-team/")
        ? `/${slug}/manage-team/knowledge-base`
        : `/${slug}/team/knowledge-base`
      : `/${slug}/knowledge-base`
    router.push(`${base}/${n.kbItem.id}`)
  } else if (n.announcement) {
    const base = pathname.includes("/manage-team/")
      ? `/${slug}/manage-team/announcements`
      : pathname === `/${slug}/team` || pathname.startsWith(`/${slug}/team/`)
        ? `/${slug}/team/announcements`
        : `/${slug}/announcements`
    router.push(`${base}/${n.announcement.id}`)
  }
}

function NotificationRow({
  n,
  slug,
  pathname,
  router,
  onDone,
}: {
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

function NotificationBell() {
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

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { session, loading, organization } = useOrganization()
  const pathname = usePathname()
  const params = useParams()
  const slug = params.companySlug as string | undefined

  const s = slug ?? ""
  const isTeamBranch =
    !!slug &&
    (pathname.startsWith(`/${s}/manage-team`) ||
      pathname === `/${s}/team` ||
      pathname.startsWith(`/${s}/team/`))

  let branch: "owner" | "leader" | "member" = "owner"
  if (slug) {
    if (pathname.startsWith(`/${slug}/manage-team`)) branch = "leader"
    else if (
      pathname === `/${slug}/team` ||
      pathname.startsWith(`/${slug}/team/`)
    )
      branch = "member"
  }

  const { data: myTeamsData } = api.team.getMyTeams.useQuery(
    { organizationId: organization?.id ?? "" },
    {
      enabled:
        !!organization && !!isTeamBranch && !session?.session?.activeTeamId,
    },
  )

  useEffect(() => {
    if (!myTeamsData || session?.session?.activeTeamId) return
    const teams = (myTeamsData as { teams?: Array<{ id: string }> } | undefined)
      ?.teams
    if (teams && teams.length > 0) {
      authClient.organization
        .setActiveTeam({ teamId: teams[0].id })
        .then(() => {
          window.location.reload()
        })
    }
  }, [myTeamsData, session])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  // Minimal layout for org page — no sidebar
  if (
    slug &&
    (pathname === `/${slug}/org` || pathname.startsWith(`/${slug}/org/`))
  ) {
    return (
      <div className="flex min-h-screen flex-col bg-background">{children}</div>
    )
  }

  return (
    <SidebarProvider>
      {branch === "owner" ? (
        <OwnerSidebar session={session} />
      ) : branch === "leader" ? (
        <LeaderSidebar session={session} />
      ) : (
        <MemberSidebar session={session} />
      )}
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger />
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

export function CompanyLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OrganizationProvider>
      <DashboardShell>{children}</DashboardShell>
    </OrganizationProvider>
  )
}
