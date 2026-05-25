"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { SiteLogo } from "@/components/site-logo"
import { AuthPageLayout } from "@/components/auth/auth-page-layout"
import { AddOrganizationForm } from "@/components/auth/add-organization-form"

export default function AddOrganizationPage() {
  const router = useRouter()
  const { data: session, isPending: sessionLoading } = authClient.useSession()
  const [nameValue, setNameValue] = useState("")

  useEffect(() => {
    if (sessionLoading) return
    if (!session) router.replace("/")
  }, [session, sessionLoading, router])

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  return (
    <AuthPageLayout
      left={
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_50%)]" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 size-96 rounded-full bg-indigo-500/5 blur-3xl" />
          <div className="relative brightness-0 invert">
            <SiteLogo />
          </div>
          <div className="relative space-y-6">
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
              Set up your workspace
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
              Name your organization. You can invite your team and customize
              everything later.
            </p>

            <div className="space-y-4 pt-4">
              {[
                { step: "1", label: "Name", done: !!nameValue },
                { step: "2", label: "Invite your team", done: false },
                { step: "3", label: "Start shipping", done: false },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-3">
                  <div
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                      s.done
                        ? "bg-indigo-500 text-white"
                        : "bg-white/10 text-zinc-400"
                    }`}
                  >
                    {s.done ? "✓" : s.step}
                  </div>
                  <span
                    className={`text-sm ${
                      s.done ? "text-white" : "text-zinc-500"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-zinc-600">
            &copy; 2026 WeirdTeams
          </p>
        </>
      }
      right={<AddOrganizationForm onNameChange={setNameValue} />}
    />
  )
}
