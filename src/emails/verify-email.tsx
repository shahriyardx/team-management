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

export function VerifyEmail({
  url = "https://teams.weirdsoft.co.uk/api/auth/verify-email?token=xxx",
}: {
  url: string
}) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address on WeirdTeams</Preview>
      <Tailwind>
        <Body className="bg-[#fafafa] font-sans mx-auto my-auto py-8 px-4">
          <Container className="bg-white border border-[#e5e7eb] rounded-lg mx-auto p-8 max-w-[480px]">
            <Text className="text-xs font-bold text-[#888] tracking-widest uppercase m-0 mb-6">
              WeirdTeams
            </Text>
            <Heading className="text-lg font-semibold text-[#111] m-0 mb-1">
              Verify your email
            </Heading>
            <Text className="text-sm text-[#555] leading-relaxed mt-2 mb-6">
              Click the button below to verify your email address. This link
              expires in 1 hour.
            </Text>

            <Button
              href={url}
              className="inline-block bg-[#000] text-white text-sm font-medium rounded-md px-6 py-3 no-underline"
            >
              Verify email
            </Button>

            <Text className="text-xs text-[#888] mt-4 mb-0 leading-relaxed">
              If you didn&apos;t request this, you can ignore this email.
            </Text>

            <Hr className="border-[#eee] my-6" />

            <Text className="text-xs text-[#999] m-0">
              &copy; 2026 WeirdTeams
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default VerifyEmail
