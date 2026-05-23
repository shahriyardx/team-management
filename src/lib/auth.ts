import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { organization } from "better-auth/plugins/organization"
import { twoFactor } from "better-auth/plugins"
import { passkey } from "@better-auth/passkey"
import { haveIBeenPwned } from "better-auth/plugins/haveibeenpwned"
import { prisma } from "./prisma"
import { sendInvitationEmail } from "./email"

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    haveIBeenPwned(),
    passkey(),
    twoFactor({ allowPasswordless: true }),
    organization({
      teams: { enabled: true },
      requireEmailVerificationOnInvitation: false,
      schema: {
        organization: {
          additionalFields: {
            websiteUrl: { type: "string", required: false },
            department: { type: "string", required: false },
            teamSize: { type: "string", required: false },
          },
        },
        teamMember: {
          // @ts-expect-error: idk
          additionalFields: {
            role: { type: "string" },
          },
        },
      },
      sendInvitationEmail: async (data) => {
        const url = `${process.env.BETTER_AUTH_URL}/invitations/accept?id=${data.id}`
        console.log(url)
        await sendInvitationEmail({
          to: data.email,
          organizationName: data.organization.name,
          inviterName: data.inviter.user.name,
          role: data.role,
          acceptUrl: url,
        })
      },
    }),
  ],
})
