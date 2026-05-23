"use client"

import { useCallback, useEffect, useState } from "react"
import { UserPlus } from "@phosphor-icons/react"
import { useOrganization } from "@/lib/organization-context"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/trpc/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type OrgMember = {
  id: string
  userId: string
  role: string
  user: { id: string; name: string; email: string; image: string | null | undefined }
}

export default function TeamMembersPage() {
  const { organization } = useOrganization()
  const { data: session } = authClient.useSession()
  const activeTeamId = session?.session?.activeTeamId

  const { data, isLoading, refetch } = api.team.getById.useQuery(
    { teamId: activeTeamId ?? "", organizationId: organization?.id ?? "" },
    { enabled: !!organization && !!activeTeamId },
  )
  const team = data?.team

  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([])
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [addMemberEmail, setAddMemberEmail] = useState("")
  const [adding, setAdding] = useState(false)

  const loadOrgMembers = useCallback(async () => {
    if (!organization) return
    const res = await authClient.organization.listMembers({
      query: { organizationSlug: organization.slug },
    })
    setOrgMembers((res.data?.members ?? []) as OrgMember[])
  }, [organization])

  useEffect(() => {
    if (organization) loadOrgMembers()
  }, [organization, loadOrgMembers])

  const matchedMember = addMemberEmail
    ? orgMembers.find((m) => m.user.email.toLowerCase() === addMemberEmail.toLowerCase())
    : null

  const alreadyInTeam = matchedMember && team
    ? team.members.some((tm) => tm.userId === matchedMember.userId)
    : false

  const handleAddMember = async () => {
    if (!matchedMember || alreadyInTeam || !activeTeamId) return
    setAdding(true)
    try {
      await authClient.organization.addTeamMember({ teamId: activeTeamId, userId: matchedMember.userId })
      setAddMemberOpen(false)
      setAddMemberEmail("")
      refetch()
    } catch { /* silent */ }
    finally { setAdding(false) }
  }

  if (isLoading || !organization) {
    return <div className="flex flex-1 flex-col gap-4 p-6"><Skeleton className="h-6 w-48" /><Skeleton className="h-32" /></div>
  }

  if (!team) {
    return <div className="flex flex-1 items-center justify-center p-6"><p className="text-xs text-muted-foreground">Team not found.</p></div>
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Members</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{team.members.length} member{team.members.length !== 1 ? "s" : ""}</p>
        </div>
        <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <UserPlus className="size-3.5 mr-1" />
                Add member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add member to {team.name}</DialogTitle>
                <DialogDescription>Enter org member email to add them to this team.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    placeholder="member@company.com"
                    value={addMemberEmail}
                    onChange={(e) => setAddMemberEmail(e.target.value)}
                  />
                </Field>
                {matchedMember && (
                  <div className="flex items-center gap-3 rounded-sm border border-border p-3">
                    <Avatar size="sm">
                      {matchedMember.user.image ? <AvatarImage src={matchedMember.user.image} alt={matchedMember.user.name} /> : null}
                      <AvatarFallback>{matchedMember.user.name?.charAt(0)?.toUpperCase() ?? "?"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-medium text-foreground">{matchedMember.user.name}</p>
                      <p className="text-xs text-muted-foreground">{matchedMember.user.email}</p>
                    </div>
                    {alreadyInTeam && (
                      <p className="ml-auto text-xs text-amber-500">Already in team</p>
                    )}
                  </div>
                )}
                {addMemberEmail && !matchedMember && (
                  <p className="text-xs text-muted-foreground">No org member found with this email.</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setAddMemberOpen(false); setAddMemberEmail("") }}>Cancel</Button>
                <Button onClick={handleAddMember} disabled={!matchedMember || alreadyInTeam || adding}>
                  {adding ? "Adding..." : "Add"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
