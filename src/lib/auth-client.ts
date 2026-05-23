import { createAuthClient } from "better-auth/react"
import { organizationClient, twoFactorClient, inferOrgAdditionalFields } from "better-auth/client/plugins"
import { passkeyClient } from "@better-auth/passkey/client"
import type { auth } from "./auth"

export const authClient = createAuthClient({
  plugins: [
    passkeyClient(),
    twoFactorClient({
      twoFactorPage: "/auth/two-factor",
    }),
    organizationClient({
      teams: { enabled: true },
      schema: inferOrgAdditionalFields<typeof auth>(),
    }),
  ],
})

export type OrgAdditionalFields = {
  websiteUrl?: string | null
  department?: string | null
  teamSize?: string | null
}
