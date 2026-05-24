import type { Metadata } from "next"
import { Mail, MessageSquare } from "lucide-react"
import { PublicHeader } from "@/components/public-header"
import { Footer } from "@/components/footer"
import { ContactForm } from "./contact-form"

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
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
