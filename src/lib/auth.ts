import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { organization } from "better-auth/plugins/organization"
import { prisma } from "./prisma"
import { sendInvitationEmail } from "./email"

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: "http://localhost:3000",
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    organization({
      teams: { enabled: true },
      schema: {
        teamMember: {
          additionalFields: {
            role: { type: "string" },
          },
        },
      } as any,
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
