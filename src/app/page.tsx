"use client"

import { useCallback, useState } from "react"
import { BarChart3, BookOpen, ListChecks, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

const features = [
  {
    icon: ListChecks,
    title: "Team Tasks",
    description:
      "Create, assign, and track tasks across your team in real time.",
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    description:
      "Centralized docs, guides, and resources for your entire team.",
  },
  {
    icon: Users,
    title: "Member Management",
    description: "Manage roles, permissions, and onboarding in one place.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Track progress, velocity, and team performance over time.",
  },
]

export default function Home() {
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams(window.location.search)
    const invitation = params.get("invitation")
    await authClient.signIn.social({
      provider: "google",
      callbackURL: invitation ? `/invitations/accept?id=${invitation}` : "/dashboard",
    })
  }, [])

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left: Brand & Info */}
      <div className="flex flex-col justify-between bg-linear-to-br from-zinc-950 via-zinc-900 to-indigo-950 px-8 py-12 sm:px-12 sm:py-16 lg:w-1/2 lg:px-16">
        <div>
          <h1 className="text-4xl font-bold tracking-[0.15em] text-white sm:text-5xl">
            PULSE
          </h1>
          <p className="mt-2 text-sm text-zinc-400">Your team, in sync.</p>
        </div>

        <div className="my-16 space-y-10 lg:my-0">
          {features.map((f) => (
            <div key={f.title} className="group flex gap-4">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-white/5 text-zinc-400 transition-colors group-hover:bg-white/10 group-hover:text-white">
                <f.icon className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                  {f.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-zinc-600">&copy; 2026 Team Pulse</p>
      </div>

      {/* Right: Sign-in */}
      <div className="flex flex-1 items-center justify-center bg-background px-6 py-16 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="border border-border bg-card p-8">
            <h2 className="text-lg font-semibold text-card-foreground">
              Sign in
            </h2>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">
              Use your Google account to continue.
            </p>
            <Button
              className="flex h-10 w-full items-center justify-center gap-3"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <GoogleIcon />
              )}
              <span>Sign in with Google</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="size-4"
      fill="currentColor"
    >
      <title>Google Icon</title>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}
