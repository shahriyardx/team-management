"use client"

import { OrganizationProvider } from "@/lib/organization-context"

export function CompanyLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return <OrganizationProvider>{children}</OrganizationProvider>
}
