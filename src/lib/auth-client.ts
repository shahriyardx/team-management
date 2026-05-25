import { createAuthClient } from "better-auth/react"
import {
  organizationClient,
  twoFactorClient,
  inferOrgAdditionalFields,
} from "better-auth/client/plugins"
import { passkeyClient } from "@better-auth/passkey/client"
import { sentinelClient } from "@better-auth/infra/client"
import type { auth } from "./auth"

export const authClient = createAuthClient({
  plugins: [
    // sentinelClient(),
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
