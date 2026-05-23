import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, Mail, MessageSquare } from "lucide-react"
import { PublicHeader } from "@/components/public-header"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Contact — WeirdTeams",
  description: "Get in touch with the WeirdTeams team.",
}

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <section className="flex-1 border-b border-border px-6 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Contact us
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Have a question or want to learn more? We'd love to hear from you.
            </p>
          </div>

          <div className="mt-14 grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-2 space-y-6">
              <div className="border border-border p-6">
                <Mail className="size-5 text-foreground" />
                <h3 className="mt-4 text-sm font-medium text-foreground">Email</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Send us an email anytime.
                </p>
                <a
                  href="mailto:hello@weirdteams.com"
                  className="mt-3 inline-block text-xs text-foreground hover:underline"
                >
                  hello@weirdteams.com
                </a>
              </div>
              <div className="border border-border p-6">
                <MessageSquare className="size-5 text-foreground" />
                <h3 className="mt-4 text-sm font-medium text-foreground">Chat</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Have a quick question? Reach out.
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Response time: within 24 hours.
                </p>
              </div>
            </div>

            <div className="lg:col-span-3 border border-border p-6 sm:p-8">
              <h2 className="text-sm font-medium text-foreground">Send us a message</h2>
              <form className="mt-6 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="text-xs font-medium text-foreground">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      placeholder="Your name"
                      className="mt-1.5 block h-9 w-full rounded-none border border-border bg-transparent px-3 text-xs text-foreground outline-hidden placeholder:text-muted-foreground/60 focus:border-ring focus:ring-1 focus:ring-ring/50"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="text-xs font-medium text-foreground">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      placeholder="you@company.com"
                      className="mt-1.5 block h-9 w-full rounded-none border border-border bg-transparent px-3 text-xs text-foreground outline-hidden placeholder:text-muted-foreground/60 focus:border-ring focus:ring-1 focus:ring-ring/50"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="text-xs font-medium text-foreground">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    placeholder="What is this about?"
                    className="mt-1.5 block h-9 w-full rounded-none border border-border bg-transparent px-3 text-xs text-foreground outline-hidden placeholder:text-muted-foreground/60 focus:border-ring focus:ring-1 focus:ring-ring/50"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="text-xs font-medium text-foreground">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    placeholder="Tell us more..."
                    className="mt-1.5 block w-full rounded-none border border-border bg-transparent px-3 py-2 text-xs text-foreground outline-hidden placeholder:text-muted-foreground/60 resize-y focus:border-ring focus:ring-1 focus:ring-ring/50"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-foreground px-5 text-xs font-medium text-background hover:bg-foreground/90 transition-colors"
                >
                  Send message
                  <ArrowRight className="size-3" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
