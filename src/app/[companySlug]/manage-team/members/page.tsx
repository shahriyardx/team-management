"use client"

import { useOrganization } from "@/lib/organization-context"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/trpc/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function TeamMembersPage() {
  const { organization } = useOrganization()
  const { data: session } = authClient.useSession()
  const activeTeamId = session?.session?.activeTeamId

  const { data, isLoading } = api.team.getById.useQuery(
    { teamId: activeTeamId ?? "", organizationId: organization?.id ?? "" },
    { enabled: !!organization && !!activeTeamId },
  )
  const team = data?.team

  if (isLoading || !organization) {
    return <div className="flex flex-1 flex-col gap-4 p-6"><Skeleton className="h-6 w-48" /><Skeleton className="h-32" /></div>
  }

  if (!team) {
    return <div className="flex flex-1 items-center justify-center p-6"><p className="text-xs text-muted-foreground">Team not found.</p></div>
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{team.name} — Members</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{team.members.length} member{team.members.length !== 1 ? "s" : ""}</p>
      </div>
      <div className="space-y-1">
        {team.members.map((tm) => (
          <div key={tm.id} className="flex items-center gap-3 border border-border px-4 py-3">
            <Avatar className="size-8">
              <AvatarImage src={tm.user.image ?? undefined} />
              <AvatarFallback className="text-xs">{tm.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{tm.user.name}</span>
                {team.leader?.user?.id === tm.user.id && <Badge variant="outline" className="text-[9px]">Leader</Badge>}
                {tm.role === "leader" && team.leader?.user?.id !== tm.user.id && <Badge variant="secondary" className="text-[9px]">Co-leader</Badge>}
              </div>
              <p className="text-xs text-muted-foreground truncate">{tm.user.email}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
