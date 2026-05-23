import Link from "next/link"
import type { Metadata } from "next"
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ListChecks,
  MessageSquare,
  Target,
  Users,
} from "lucide-react"
import { PublicHeader } from "@/components/public-header"
import { Footer } from "@/components/footer"
import { FAQItem } from "@/components/faq-item"

export const metadata: Metadata = {
  title: "WeirdTeams — Team Management Platform",
  description:
    "A simple workspace for teams that want to move faster. Tasks, knowledge base, OKR tracking, and member management in one place.",
  openGraph: {
    title: "WeirdTeams — Team Management Platform",
    description:
      "A simple workspace for teams that want to move faster. Tasks, knowledge base, OKR tracking, and member management in one place.",
  },
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
    description: "Centralize docs, guides, and resources. Search across everything.",
  },
  {
    icon: Target,
    title: "OKR Tracking",
    description: "Set objectives and key results. Track progress across teams.",
  },
  {
    icon: Users,
    title: "Member Management",
    description: "Manage roles, permissions, and team structure in seconds.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Track progress, velocity, and team performance over time.",
  },
  {
    icon: MessageSquare,
    title: "Collaboration",
    description: "Comment on tasks, share knowledge, keep conversations actionable.",
  },
]

const steps = [
  {
    number: "01",
    title: "Set up your workspace",
    description: "Create your organization, set up teams, and configure in minutes.",
  },
  {
    number: "02",
    title: "Invite your team",
    description: "Add members, assign roles, and organize into teams.",
  },
  {
    number: "03",
    title: "Ship together",
    description: "Create tasks, track OKRs, and build your knowledge base.",
  },
]

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For small teams getting started.",
    features: [
      "Up to 5 members per team",
      "Task management",
      "Knowledge base",
      "Member management",
      "Basic analytics",
    ],
    cta: "Get started free",
    href: "/auth/register",
  },
  {
    name: "Pro",
    price: "$19",
    period: "/mo",
    description: "For growing teams that need more.",
    features: [
      "Unlimited members per team",
      "Everything in Free",
      "OKR tracking",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Start free trial",
    href: "/auth/register",
    highlighted: true,
  },
]

const faqs = [
  {
    q: "What is WeirdTeams?",
    a: "A team management platform that combines tasks, knowledge base, and OKR tracking into one workspace.",
  },
  {
    q: "Is it free to get started?",
    a: "Yes. Free plan includes up to 5 members per team with tasks, knowledge base, and member management. No credit card.",
  },
  {
    q: "Can I manage multiple teams?",
    a: "Yes. Create multiple teams within your org, each with its own members, tasks, and knowledge base.",
  },
  {
    q: "How does OKR tracking work?",
    a: "Set objectives with key results, assign to team members, track progress in real time.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. Export your tasks, knowledge base articles, and other data at any time.",
  },
]

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-28 sm:px-8 sm:py-36 lg:py-44">
          <div className="max-w-4xl">
            <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-foreground sm:text-7xl lg:text-8xl">
              Teams that ship.
              <br />
              Teams that win.
            </h1>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground sm:text-base max-w-lg">
              Tasks. Knowledge. OKRs. One workspace. No noise.
            </p>
            <div className="mt-10 flex items-center gap-3 sm:gap-4">
              <Link
                href="/auth/register"
                className="inline-flex h-11 items-center gap-1.5 rounded-md bg-foreground px-7 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors"
              >
                Get started free
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex h-11 items-center rounded-md border border-border px-7 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 sm:py-28">
          <div className="mb-16">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
              / everything you need
            </p>
          </div>
          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3 border border-border bg-border">
            {features.map((f) => (
              <div key={f.title} className="bg-background p-6 sm:p-8">
                <div className="flex size-10 items-center justify-center rounded-md bg-accent text-foreground">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-5 text-sm font-bold text-foreground">{f.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 sm:py-28">
          <div className="mb-16">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
              / how it works
            </p>
          </div>
          <div className="grid gap-12 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.number} className="relative">
                <span className="text-5xl font-black text-muted-foreground/20">
                  {step.number}
                </span>
                <h3 className="mt-1 text-sm font-bold text-foreground">{step.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground max-w-xs">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 sm:py-28">
          <div className="mb-16">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
              / simple pricing
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 max-w-2xl">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col border border-border p-8 ${
                  plan.highlighted ? "border-foreground" : ""
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-2.5 left-5 inline-flex items-center rounded-full bg-foreground px-3 py-0.5 text-[10px] font-medium text-background">
                    Most popular
                  </div>
                )}
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-0.5">
                  <span className="text-4xl font-black text-foreground">{plan.price}</span>
                  {plan.period && (
                    <span className="text-xs text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{plan.description}</p>
                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="size-3.5 text-foreground shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mt-8 inline-flex h-10 items-center justify-center rounded-md px-5 text-xs font-semibold transition-colors ${
                    plan.highlighted
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : "border border-border text-foreground hover:bg-accent"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="ml-1.5 size-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 sm:py-28">
          <div className="mb-12">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
              / faq
            </p>
          </div>
          <div>
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8 sm:py-32">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
              / ready?
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Start shipping faster.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Free for small teams. No credit card required.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Link
                href="/auth/register"
                className="inline-flex h-11 items-center gap-1.5 rounded-md bg-foreground px-7 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors"
              >
                Get started free
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-11 items-center rounded-md border border-border px-7 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
              >
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
