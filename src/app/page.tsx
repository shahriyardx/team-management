import Link from "next/link"
import { BarChart3, BookOpen, ListChecks, Target, Users } from "lucide-react"
import { LandingNav } from "@/components/landing-nav"

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
    icon: Target,
    title: "OKR Tracking",
    description: "Set objectives and key results. Track progress across teams.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Track progress, velocity, and team performance over time.",
  },
]

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4 sm:px-12 border-b border-border">
        <h1 className="text-lg font-bold tracking-[0.15em] text-foreground">WEIRDTEAMS</h1>
        <div className="flex items-center gap-3">
          <LandingNav />
        </div>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 sm:px-12 lg:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Your team, in sync.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base max-w-lg mx-auto">
            WeirdTeams brings tasks, knowledge, and people together. A simple workspace for teams that want to move faster.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/auth/register">
              <span className="inline-flex h-10 items-center rounded-md bg-foreground px-6 text-sm font-medium text-background hover:bg-foreground/90 transition-colors">
                Get started free
              </span>
            </Link>
            <Link href="/auth/login">
              <span className="inline-flex h-10 items-center rounded-md border border-border px-6 text-sm font-medium text-foreground hover:bg-accent transition-colors">
                Sign in
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border px-6 py-20 sm:px-12">
        <div className="mx-auto max-w-5xl">
          <h3 className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider">Everything you need</h3>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="border border-border p-6">
                <div className="flex size-10 items-center justify-center rounded-md bg-accent text-foreground">
                  <f.icon className="size-5" />
                </div>
                <h4 className="mt-4 text-sm font-medium text-foreground">{f.title}</h4>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-6 sm:px-12">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">&copy; 2026 WeirdTeams</p>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/auth/register" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
