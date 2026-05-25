import type { Metadata } from "next"
import { PublicHeader } from "@/components/public-header"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Privacy Policy — WeirdTeams",
  description: "WeirdTeams privacy policy — how we handle your data.",
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <section className="flex-1 border-b border-border px-6 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-xs text-muted-foreground">
            Last updated: May 23, 2026
          </p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
            <div>
              <h2 className="text-base font-medium text-foreground mb-3">
                1. Introduction
              </h2>
              <p>
                WeirdTeams ("we," "our," or "us") is committed to protecting
                your privacy. This Privacy Policy explains how we collect, use,
                disclose, and safeguard your information when you use our
                platform.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-foreground mb-3">
                2. Information We Collect
              </h2>
              <p className="mb-3">
                We collect information that you provide directly to us:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Account information: name, email address, and password</li>
                <li>Profile information: avatar, bio, and preferences</li>
                <li>
                  Content: tasks, knowledge base articles, comments, and other
                  data you create
                </li>
                <li>Team and organization information you provide</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-medium text-foreground mb-3">
                3. How We Use Your Information
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>To provide, maintain, and improve our services</li>
                <li>To authenticate your account and secure your data</li>
                <li>
                  To send you updates, security alerts, and support messages
                </li>
                <li>To respond to your comments, questions, and requests</li>
                <li>
                  To monitor and analyze usage patterns and improve our platform
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-medium text-foreground mb-3">
                4. Data Sharing
              </h2>
              <p>
                We do not sell your personal information. We may share data with
                third-party service providers who help us operate our platform
                (e.g., hosting, email delivery). These providers are bound by
                confidentiality agreements and are not permitted to use your
                data for any purpose other than providing services to us.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-foreground mb-3">
                5. Data Security
              </h2>
              <p>
                We implement industry-standard security measures to protect your
                data, including encryption at rest and in transit, regular
                security audits, and access controls. However, no method of
                transmission over the Internet is 100% secure.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-foreground mb-3">
                6. Data Retention
              </h2>
              <p>
                We retain your information for as long as your account is
                active. If you delete your account, we will delete your data
                within 30 days, except where we are required to retain it for
                legal purposes.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-foreground mb-3">
                7. Your Rights
              </h2>
              <p className="mb-3">
                Depending on your jurisdiction, you may have the right to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Access the personal data we hold about you</li>
                <li>Request correction or deletion of your data</li>
                <li>Object to or restrict processing of your data</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-medium text-foreground mb-3">
                8. Cookies
              </h2>
              <p>
                We use essential cookies for authentication and security
                purposes. We do not use tracking cookies or third-party
                analytics cookies that require consent.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-foreground mb-3">
                9. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of material changes via email or through the
                platform.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-foreground mb-3">
                10. Contact
              </h2>
              <p>
                If you have questions about this Privacy Policy, please contact
                us at{" "}
                <a
                  href="mailto:hello@weirdteams.com"
                  className="text-foreground hover:underline"
                >
                  hello@weirdteams.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
