import { createAuthClient } from "better-auth/react"
import { organizationClient, inferOrgAdditionalFields } from "better-auth/client/plugins"
import type { auth } from "./auth"

export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      teams: { enabled: true },
      schema: inferOrgAdditionalFields<typeof auth>(),
    }),
  ],
})
