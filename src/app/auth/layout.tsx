import type { Metadata } from "next"
import { BarChart3, BookOpen, ListChecks, Users } from "lucide-react"

export const metadata: Metadata = {
  title: "Sign In — WeirdTeams",
  description: "Sign in to your WeirdTeams account or create a new one.",
}

const features = [
  {
    icon: ListChecks,
    title: "Team Tasks",
    description: "Create, assign, and track tasks across your team in real time.",
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    description: "Centralized docs, guides, and resources for your entire team.",
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

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="hidden lg:flex lg:flex-col lg:justify-between bg-linear-to-br from-zinc-950 via-zinc-900 to-indigo-950 px-8 py-12 sm:px-12 sm:py-16 lg:w-1/2 lg:px-16">
        <div>
          <h1 className="text-4xl font-bold tracking-[0.15em] text-white sm:text-5xl">WEIRDTEAMS</h1>
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
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">{f.description}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-zinc-600">&copy; 2026 WeirdTeams</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background px-6 py-16 lg:w-1/2">
        {children}
      </div>
    </div>
  )
}
