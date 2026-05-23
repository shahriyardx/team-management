import { ArrowRight } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"
import { PublicHeader } from "@/components/public-header"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "About — WeirdTeams",
  description: "Learn about WeirdTeams and our mission to make team collaboration simple.",
}

const values = [
  {
    title: "Simplicity",
    description: "Every feature should make your life easier, not harder. We build with restraint.",
  },
  {
    title: "Clarity",
    description: "Teams move faster when everyone sees the same picture. We make that picture clear.",
  },
  {
    title: "Alignment",
    description: "Tasks, knowledge, and objectives should connect, not live in separate silos.",
  },
  {
    title: "Velocity",
    description: "Reduce friction, not features. Help teams ship what matters.",
  },
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <section className="border-b border-border px-6 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            About WeirdTeams
          </h1>
          <div className="mt-8 space-y-5 text-sm leading-relaxed text-muted-foreground">
            <p>
              WeirdTeams started with a simple observation: most team tools do too much and deliver too little.
              Teams don't need another platform with a hundred features they'll never use. They need a focused
              workspace where tasks, knowledge, and objectives actually connect.
            </p>
            <p>
              We built WeirdTeams to be that workspace. A single place to manage tasks, share knowledge,
              track OKRs, and organize people — without the noise of tools built for enterprises with
              teams of teams.
            </p>
            <p>
              Today, WeirdTeams is used by small and growing teams who want to move faster without
              switching between five different apps. We're independent, we're focused, and we're just getting started.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border px-6 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            What we believe
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {values.map((v) => (
              <div key={v.title} className="border border-border p-6">
                <h3 className="text-sm font-medium text-foreground">{v.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border px-6 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Get started today
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Free for small teams. No credit card required.
          </p>
          <div className="mt-8">
            <Link
              href="/auth/register"
              className="inline-flex h-10 items-center gap-1.5 rounded-md bg-foreground px-6 text-sm font-medium text-background hover:bg-foreground/90 transition-colors"
            >
              Get started free
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
