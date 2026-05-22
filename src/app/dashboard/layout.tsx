"use client"

import { useEffect, useRef, useState } from "react"
import { Bell } from "@phosphor-icons/react"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { OrganizationProvider, useOrganization } from "@/lib/organization-context"
import { AppSidebar } from "@/components/app-sidebar"
import { api } from "@/lib/trpc/client"

function NotificationBell() {
  const { organization } = useOrganization()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data, refetch } = api.notification.listUnread.useQuery(
    { organizationId: organization?.id ?? "" },
    { enabled: !!organization, refetchInterval: 30_000 },
  )
  const notifications = data?.notifications ?? []
  const markReadMutation = api.notification.markRead.useMutation({ onSuccess: () => refetch() })
  const markAllReadMutation = api.notification.markAllRead.useMutation({ onSuccess: () => refetch() })

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <Button variant="ghost" size="icon" className="size-7" onClick={() => setOpen(!open)}>
        <Bell className="size-4" />
        {notifications.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-destructive text-[8px] font-medium text-destructive-foreground">
            {notifications.length > 9 ? "9+" : notifications.length}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-none border border-border bg-popover text-popover-foreground shadow-md">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-medium">Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate({ organizationId: organization?.id ?? "" })}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">No notifications</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markReadMutation.mutate({ id: n.id })}
                  className="w-full border-b border-border px-3 py-2 text-left transition-colors hover:bg-accent"
                >
                  <p className="text-xs font-medium text-foreground">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-[10px] text-muted-foreground">{n.body}</p>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { session, loading } = useOrganization()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar session={session} />
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger />
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <span className="text-xs text-muted-foreground">{session?.user?.email}</span>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrganizationProvider>
      <DashboardShell>{children}</DashboardShell>
    </OrganizationProvider>
  )
}
