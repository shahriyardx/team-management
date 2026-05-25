"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Prohibit,
  Trash,
  UserPlus,
  Users as UsersIcon,
} from "@phosphor-icons/react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel } from "@/components/ui/field"
import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"
import { authClient } from "@/lib/auth-client"
import { useRouter, useParams } from "next/navigation"

type OrgMember = {
  id: string
  userId: string
  role: string
  user: {
    id: string
    name: string
    email: string
    image: string | null | undefined
  }
}

interface TeamMember {
  id: string
  role: string
  status: string
  userId: string
  user: {
    id: string
    name: string
    email: string
    image: string | null | undefined
  }
}

interface Team {
  id: string
  name: string
  leaderId: string | null
  leader: OrgMember | null
  members: TeamMember[]
}

export function TeamDetail({ teamId }: { teamId: string }) {
  const router = useRouter()
  const params = useParams()
  const companySlug = params.companySlug as string
  const { session, organization } = useOrganization()

  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [switchLeaderOpen, setSwitchLeaderOpen] = useState(false)
  const [newLeaderMemberId, setNewLeaderMemberId] = useState("")
  const [newMemberUserId, setNewMemberUserId] = useState("")
  const [removing, setRemoving] = useState<string | null>(null)

  const {
    data: teamsData,
    isLoading,
    refetch,
  } = api.team.list.useQuery(
    { organizationId: organization?.id ?? "" },
    { enabled: !!organization },
  )
  const teams = (teamsData?.teams ?? []) as Team[]
  const team = teams.find((t) => t.id === teamId) ?? null

  const setLeader = api.team.setLeader.useMutation({
    onSuccess: () => {
      setSwitchLeaderOpen(false)
      setNewLeaderMemberId("")
      refetch()
    },
  })

  const deleteTeam = api.team.delete.useMutation({
    onSuccess: () => router.push(`/${companySlug}/teams`),
  })

  const removeMember = api.team.removeTeamMember.useMutation({
    onSuccess: () => refetch(),
  })

  const setMemberStatus = api.team.setTeamMemberStatus.useMutation({
    onSuccess: () => refetch(),
  })

  const canManage = currentUserRole === "owner" || currentUserRole === "admin"

  const loadOrgMembers = useCallback(async () => {
    if (!organization) return
    const res = await authClient.organization.listMembers({
      query: { organizationSlug: organization.slug },
    })
    const members = (res.data?.members ?? []) as OrgMember[]
    setOrgMembers(members)
    if (session?.user?.id) {
      const me = members.find((m) => m.userId === session.user.id)
      if (me) setCurrentUserRole(me.role)
    }
  }, [organization, session?.user?.id])

  useEffect(() => {
    if (organization) loadOrgMembers()
  }, [organization, loadOrgMembers])

  const getAvailableMembers = () => {
    if (!team) return []
    const existingUserIds = new Set(team.members.map((tm) => tm.userId))
    return orgMembers.filter((m) => !existingUserIds.has(m.userId))
  }

  const handleAddMember = async () => {
    if (!newMemberUserId) return
    try {
      await authClient.organization.addTeamMember({
        teamId,
        userId: newMemberUserId,
      })
      setAddMemberOpen(false)
      setNewMemberUserId("")
      refetch()
    } catch {
      /* silent */
    }
  }

  const handleRemoveMember = (userId: string) => {
    setRemoving(userId)
    removeMember.mutate(
      { teamId, organizationId: organization?.id ?? "", userId },
      { onSettled: () => setRemoving(null) },
    )
  }

  const handleDeleteTeam = () => {
    deleteTeam.mutate({ teamId, organizationId: organization?.id ?? "" })
  }

  const isTeamLeader = () => {
    if (!team) return false
    const me = orgMembers.find((m) => m.userId === session?.user?.id)
    return me ? team.leaderId === me.id : false
  }

  const canManageTeam = () => canManage || isTeamLeader()

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
        <UsersIcon className="size-10 text-muted-foreground/40" />
        <div className="text-center">
          <h2 className="text-sm font-medium text-foreground">
            Team not found
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            This team doesn't exist or has been deleted.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.push(`/${companySlug}/teams`)}
          >
            Back to teams
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <button
          onClick={() => router.push(`/${companySlug}/teams`)}
          className="text-xs text-muted-foreground hover:text-foreground mb-2"
        >
          &larr; Back to teams
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {team.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {canManage && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteTeam}
                disabled={deleteTeam.isPending}
              >
                <Trash className="size-3.5" />
                {deleteTeam.isPending ? "Deleting..." : "Delete"}
              </Button>
            )}
          </div>
        </div>
        {team.leader && (
          <div className="mt-2 flex items-center gap-2">
            <Avatar size="sm">
              {team.leader.user.image ? (
                <AvatarImage
                  src={team.leader.user.image}
                  alt={team.leader.user.name}
                />
              ) : null}
              <AvatarFallback>
                {team.leader.user.name?.charAt(0)?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              Led by{" "}
              <span className="font-medium text-foreground">
                {team.leader.user.name}
              </span>
            </span>
          </div>
        )}
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-xs font-medium text-foreground">
            Members ({team.members.length})
          </h2>
          <div className="flex items-center gap-2">
            {canManage && (
              <Dialog
                open={switchLeaderOpen}
                onOpenChange={setSwitchLeaderOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    Switch leader
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Switch team leader</DialogTitle>
                    <DialogDescription>
                      Select new leader. Current leader becomes regular member.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Field>
                      <FieldLabel>New leader</FieldLabel>
                      <Select
                        value={newLeaderMemberId}
                        onValueChange={setNewLeaderMemberId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a member..." />
                        </SelectTrigger>
                        <SelectContent>
                          {team.members.filter(
                            (tm) => team.leader?.user?.id !== tm.user.id,
                          ).length === 0 ? (
                            <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                              No other members to assign.
                            </div>
                          ) : (
                            team.members
                              .filter(
                                (tm) => team.leader?.user?.id !== tm.user.id,
                              )
                              .map((tm) => {
                                const orgMember = orgMembers.find(
                                  (m) => m.userId === tm.userId,
                                )
                                return (
                                  <SelectItem
                                    key={tm.id}
                                    value={orgMember?.id ?? ""}
                                  >
                                    {tm.user.name}
                                  </SelectItem>
                                )
                              })
                          )}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setSwitchLeaderOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (newLeaderMemberId) {
                          setLeader.mutate({
                            teamId: team.id,
                            leaderMemberId: newLeaderMemberId,
                          })
                        }
                      }}
                      disabled={!newLeaderMemberId || setLeader.isPending}
                    >
                      {setLeader.isPending ? "Switching..." : "Switch"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={!canManageTeam()}>
                  <UserPlus className="size-3.5" />
                  Add member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add member to {team.name}</DialogTitle>
                  <DialogDescription>
                    Select an org member to add.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Field>
                    <FieldLabel>Member</FieldLabel>
                    <Select
                      value={newMemberUserId}
                      onValueChange={setNewMemberUserId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a member..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableMembers().length === 0 ? (
                          <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                            All members already in this team.
                          </div>
                        ) : (
                          getAvailableMembers().map((m) => (
                            <SelectItem key={m.userId} value={m.userId}>
                              {m.user.name} ({m.user.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAddMemberOpen(false)
                      setNewMemberUserId("")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddMember} disabled={!newMemberUserId}>
                    Add
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="rounded-none border border-border">
          {team.members.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
              No members in this team yet.
            </div>
          ) : (
            team.members.map((tm, idx) => {
              const isLeader = team.leader?.user?.id === tm.user.id
              return (
                <div
                  key={tm.id}
                  className={`flex items-center gap-3 px-4 py-3 ${idx < team.members.length - 1 ? "border-b border-border" : ""}`}
                >
                  <Avatar size="sm">
                    {tm.user.image ? (
                      <AvatarImage src={tm.user.image} alt={tm.user.name} />
                    ) : null}
                    <AvatarFallback>
                      {tm.user.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {tm.user.name}
                      {isLeader && (
                        <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                          (leader)
                        </span>
                      )}
                      {tm.status === "inactive" && (
                        <span className="ml-1.5 text-xs text-destructive font-normal">
                          inactive
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {tm.user.email}
                    </p>
                  </div>
                  {canManageTeam() && (canManage || !isLeader) && (
                    <div className="flex items-center gap-1">
                      {!isLeader && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            setMemberStatus.mutate({
                              teamId,
                              organizationId: organization?.id ?? "",
                              userId: tm.userId,
                              status:
                                tm.status === "inactive"
                                  ? "active"
                                  : "inactive",
                            })
                          }
                          disabled={setMemberStatus.isPending}
                        >
                          <Prohibit className="size-3 mr-1" />
                          {tm.status === "inactive" ? "Activate" : "Deactivate"}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveMember(tm.userId)}
                        disabled={removing === tm.userId}
                      >
                        <Trash className="size-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
