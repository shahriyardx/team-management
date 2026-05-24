import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components"
import { Tailwind } from "@react-email/tailwind"

export function InvitationEmail({
  organizationName = "Acme Corp",
  inviterName = "John",
  role = "member",
  acceptUrl = "https://teams.weirdsoft.co.uk/invitations/accept?id=123",
}: {
  organizationName: string
  inviterName: string
  role: string
  acceptUrl: string
}) {
  return (
    <Html>
      <Head />
      <Preview>Join {organizationName} on WeirdTeams</Preview>
      <Tailwind>
        <Body className="bg-[#fafafa] font-sans mx-auto my-auto py-8 px-4">
          <Container className="bg-white border border-[#e5e7eb] rounded-lg mx-auto p-8 max-w-[480px]">
            <Text className="text-xs font-bold text-[#888] tracking-widest uppercase m-0 mb-6">
              WeirdTeams
            </Text>
            <Heading className="text-lg font-semibold text-[#111] m-0 mb-1">
              Join {organizationName}
            </Heading>
            <Text className="text-sm text-[#555] leading-relaxed mt-2 mb-6">
              {inviterName} has invited you to join{" "}
              <strong>{organizationName}</strong> as <strong>{role}</strong>.
            </Text>

            <Button
              href={acceptUrl}
              className="inline-block bg-[#000] text-white text-sm font-medium rounded-md px-6 py-3 no-underline"
            >
              Accept invitation
            </Button>

            <Text className="text-xs text-[#888] mt-4 mb-0 leading-relaxed">
              This invitation expires in 48 hours. If you weren't expecting
              this, you can ignore this email.
            </Text>

            <Hr className="border-[#eee] my-6" />

            <Text className="text-xs text-[#999] m-0">&copy; 2026 WeirdTeams</Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default InvitationEmail
