import { OrgDashboardLayout } from "./org-dashboard-layout"

export default function DashboardSlugLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}) {
  return (
    <OrgDashboardLayout params={params}>
      {children}
    </OrgDashboardLayout>
  )
}
