import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import { PublicHeader } from "@/components/public-header"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Terms of Service — WeirdTeams",
  description: "WeirdTeams terms of service — the rules for using our platform.",
}

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <section className="flex-1 border-b border-border px-6 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-3 text-xs text-muted-foreground">Last updated: May 23, 2026</p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
            <div>
              <h2 className="text-base font-medium text-foreground mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using WeirdTeams ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Platform.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-foreground mb-3">2. Description of Service</h2>
              <p>
                WeirdTeams provides a team management platform that includes task management, knowledge base, OKR tracking, and member management features. We reserve the right to modify, suspend, or discontinue any aspect of the Platform at any time.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-foreground mb-3">3. User Accounts</h2>
              <p className="mb-3">You are responsible for:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Ensuring the accuracy of the information you provide</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-medium text-foreground mb-3">4. Acceptable Use</h2>
              <p className="mb-3">You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Use the Platform for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to any part of the Platform</li>
                <li>Upload malicious code or content that could harm the Platform or other users</li>
                <li>Interfere with the operation of the Platform</li>
                <li>Use the Platform to distribute spam or unsolicited communications</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-medium text-foreground mb-3">5. Intellectual Property</h2>
              <p>
                You retain ownership of the content you create on the Platform. We claim no intellectual property rights over your data. The Platform itself, including its code, design, and branding, is owned by WeirdTeams.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-foreground mb-3">6. Payment Terms</h2>
              <p>
                Paid plans are billed in advance on a monthly or annual basis. Cancellations take effect at the end of the current billing period. We do not provide refunds for partial billing periods.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-foreground mb-3">7. Limitation of Liability</h2>
              <p>
                WeirdTeams shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Platform, whether based on warranty, contract, tort, or any other legal theory.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-foreground mb-3">8. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account for violation of these terms. You may terminate your account at any time through your account settings. Upon termination, your data will be deleted within 30 days.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-foreground mb-3">9. Changes to Terms</h2>
              <p>
                We reserve the right to update these terms at any time. We will notify users of material changes via email or through the Platform. Continued use after changes constitutes acceptance.
              </p>
            </div>

            <div>
              <h2 className="text-base font-medium text-foreground mb-3">10. Contact</h2>
              <p>
                For questions about these terms, contact us at{" "}
                <a href="mailto:hello@weirdteams.com" className="text-foreground hover:underline">
                  hello@weirdteams.com
                </a>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
