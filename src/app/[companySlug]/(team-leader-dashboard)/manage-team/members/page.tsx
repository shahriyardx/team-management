"use client"

import { useState } from "react"
import { Prohibit, UserMinus, UserPlus } from "@phosphor-icons/react"
import { useOrganization } from "@/lib/organization-context"
import { useMemberRole } from "@/lib/use-member-role"
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
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default function TeamMembersPage() {
  const { organization } = useOrganization()
  const { role } = useMemberRole()
  const { data: session } = authClient.useSession()
  const activeTeamId = session?.session?.activeTeamId

  const { data, isLoading, refetch } = api.team.getById.useQuery(
    { teamId: activeTeamId ?? "", organizationId: organization?.id ?? "" },
    { enabled: !!organization && !!activeTeamId },
  )

  const addMemberMutation = api.team.addTeamMember.useMutation({
    onSuccess: () => refetch(),
  })
  const setCoLeaderMutation = api.team.setCoLeader.useMutation({
    onSuccess: () => refetch(),
  })
  const team = data?.team
  const isLeader = team?.leader?.user?.id === session?.user?.id
  const canManage = isLeader || role === "owner" || role === "admin"

  const [addOpen, setAddOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState("")

  const handleAddMember = async () => {
    if (!activeTeamId || !email.trim() || !organization) return
    setAdding(true)
    setError("")

    const memberRes = await authClient.organization.listMembers({
      query: { organizationSlug: organization.slug },
    })
    const matched = (memberRes.data?.members ?? []).find(
      (m: { user: { email: string } }) =>
        m.user.email.toLowerCase() === email.trim().toLowerCase(),
    )
    if (!matched) {
      setError("No member found with this email in the organization")
      setAdding(false)
      return
    }

    try {
      await addMemberMutation.mutateAsync({
        teamId: activeTeamId,
        organizationId: organization.id,
        userId: matched.userId,
      })
      setAddOpen(false)
      setEmail("")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add member")
    } finally {
      setAdding(false)
    }
  }

  const removeMemberMutation = api.team.removeTeamMember.useMutation({
    onSuccess: () => refetch(),
  })

  const setMemberStatus = api.team.setTeamMemberStatus.useMutation({
    onSuccess: () => refetch(),
  })

  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null)

  const handleRemoveMember = async (userId: string) => {
    if (!activeTeamId || !organization) return
    try {
      await removeMemberMutation.mutateAsync({
        teamId: activeTeamId,
        organizationId: organization.id,
        userId,
      })
      setRemoveConfirm(null)
      refetch()
    } catch {
      setError("Failed to remove member")
    }
  }

  if (isLoading || !organization) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-xs text-muted-foreground">Team not found.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Members</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {team.members.length} member{team.members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <UserPlus className="size-3.5 mr-1" />
              Add member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add member to {team.name}</DialogTitle>
              <DialogDescription>
                Enter an email address to add to this team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  placeholder="member@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError("")
                  }}
                />
              </Field>
              {error && <FieldError>{error}</FieldError>}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAddOpen(false)
                  setEmail("")
                  setError("")
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMember}
                disabled={adding || !email.trim()}
              >
                {adding ? "Adding..." : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-1">
        {team.members.map((tm) => (
          <div
            key={tm.id}
            className="flex items-center gap-3 border border-border px-4 py-3"
          >
            <Avatar className="size-8">
              <AvatarImage src={tm.user.image ?? undefined} />
              <AvatarFallback className="text-xs">
                {tm.user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  {tm.user.name}
                </span>
                {team.leader?.user?.id === tm.user.id && (
                  <Badge variant="outline" className="text-[9px]">
                    Leader
                  </Badge>
                )}
                {tm.role === "co-leader" && (
                  <Badge variant="secondary" className="text-[9px]">
                    Co-leader
                  </Badge>
                )}
                {tm.status === "inactive" && (
                  <Badge variant="secondary" className="text-[9px]">
                    Inactive
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {tm.user.email}
              </p>
            </div>
            {canManage && team.leader?.user?.id !== tm.user.id && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    if (!activeTeamId || !organization) return
                    setCoLeaderMutation.mutate({
                      teamId: activeTeamId,
                      organizationId: organization.id,
                      userId: tm.user.id,
                      isCoLeader: tm.role !== "co-leader",
                    })
                  }}
                  disabled={setCoLeaderMutation.isPending}
                >
                  {tm.role === "co-leader"
                    ? "Remove Co-leader"
                    : "Make Co-leader"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    if (!activeTeamId || !organization) return
                    setMemberStatus.mutate({
                      teamId: activeTeamId,
                      organizationId: organization.id,
                      userId: tm.user.id,
                      status: tm.status === "inactive" ? "active" : "inactive",
                    })
                  }}
                  disabled={setMemberStatus.isPending}
                >
                  <Prohibit className="size-3 mr-1" />
                  {tm.status === "inactive" ? "Activate" : "Deactivate"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  onClick={() => setRemoveConfirm(tm.user.id)}
                >
                  <UserMinus className="size-3.5" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog
        open={!!removeConfirm}
        onOpenChange={(open) => !open && setRemoveConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this member from {team.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={removeMemberMutation.isPending}
              onClick={() => removeConfirm && handleRemoveMember(removeConfirm)}
            >
              {removeMemberMutation.isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
