"use client"

import { useCallback, useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  CaretDown,
  Plus,
  Trash,
  UserPlus,
  Users as UsersIcon,
} from "@phosphor-icons/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useOrganization } from "@/lib/organization-context"
import { useMemberRole } from "@/lib/use-member-role"
import { api } from "@/lib/trpc/client"
import { authClient } from "@/lib/auth-client"

type OrgMember = {
  id: string
  userId: string
  role: string
  user: { id: string; name: string; email: string; image: string | null | undefined }
}

interface TeamMember {
  id: string
  role: string
  userId: string
  user: { id: string; name: string; email: string; image: string | null | undefined }
}

interface Team {
  id: string
  name: string
  leaderId: string | null
  leader: OrgMember | null
  members: TeamMember[]
}

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional(),
  leaderUserId: z.string().min(1, "Team leader is required"),
})

type CreateTeamForm = z.infer<typeof createTeamSchema>

const addMemberSchema = z.object({
  userId: z.string().min(1, "Select a member"),
})

export function TeamManager() {
  const { session, organization } = useOrganization()
  const { role, loading: roleLoading } = useMemberRole()
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTeam, setEditTeam] = useState<Team | null>(null)
  const [addMemberTeamId, setAddMemberTeamId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  const { data: teamsData, isLoading, refetch } = api.team.list.useQuery(
    { organizationId: organization?.id ?? "" },
    { enabled: !!organization },
  )
  const teams = ((teamsData?.teams ?? []) as Team[]).filter((t) => t.name !== organization?.name)

  const setLeader = api.team.setLeader.useMutation({
    onSuccess: () => refetch(),
  })

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) ?? null
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

  const createForm = useForm<CreateTeamForm>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: "", description: "", leaderUserId: "" },
  })

  const addMemberForm = useForm<z.infer<typeof addMemberSchema>>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { userId: "" },
  })

  useEffect(() => {
    if (createOpen) createForm.reset({ name: "", description: "", leaderUserId: "" })
  }, [createOpen, createForm])

  useEffect(() => {
    if (addMemberTeamId) addMemberForm.reset({ userId: "" })
  }, [addMemberTeamId, addMemberForm])

  const handleCreateTeam = createForm.handleSubmit(async (data) => {
    if (!organization) return
    setCreating(true)
    try {
      const res = await authClient.organization.createTeam({
        name: data.name,
        organizationId: organization.id,
      })
      const betterTeam = res.data
      if (!betterTeam) throw new Error("Failed to create team")

      // Find member id from userId for the leader
      const leaderMember = orgMembers.find((m) => m.userId === data.leaderUserId)
      if (!leaderMember) throw new Error("Leader not found in org")

      // Set leader via tRPC
      await setLeader.mutateAsync({
        teamId: betterTeam.id,
        leaderMemberId: leaderMember.id,
      })

      setCreateOpen(false)
      refetch()
    } catch {
      // error handled silently
    } finally {
      setCreating(false)
    }
  })

  const handleRemoveMember = async (teamId: string, userId: string) => {
    setRemoving(userId)
    try {
      await authClient.organization.removeTeamMember({
        teamId,
        userId,
      })
      refetch()
    } catch {
      // silent
    } finally {
      setRemoving(null)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    try {
      await authClient.organization.removeTeam({ teamId })
      setSelectedTeamId(null)
      refetch()
    } catch {
      // silent
    }
  }

  const isTeamLeader = (team: Team) => {
    const me = orgMembers.find((m) => m.userId === session?.user?.id)
    return me ? team.leaderId === me.id : false
  }

  const canManageTeam = (team: Team) => canManage || isTeamLeader(team)

  const getAvailableMembers = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId)
    const existingUserIds = new Set(team?.members.map((tm) => tm.userId) ?? [])
    return orgMembers.filter((m) => !existingUserIds.has(m.userId))
  }

  const handleAddMember = addMemberForm.handleSubmit(async (data) => {
    if (!addMemberTeamId) return
    try {
      await authClient.organization.addTeamMember({
        teamId: addMemberTeamId,
        userId: data.userId,
      })
      setAddMemberTeamId(null)
      refetch()
    } catch {
      // silent
    }
  })

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  if (role === "member") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
        <UsersIcon className="size-10 text-muted-foreground/40" />
        <div className="text-center">
          <h2 className="text-sm font-medium text-foreground">Teams</h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            You're not part of any team yet. Your team leader will add you when ready.
          </p>
        </div>
      </div>
    )
  }

  // Detail view
  if (selectedTeam) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <button
            onClick={() => setSelectedTeamId(null)}
            className="text-xs text-muted-foreground hover:text-foreground mb-2"
          >
            &larr; Back to teams
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">{selectedTeam.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              {canManage && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteTeam(selectedTeam.id)}
                >
                  <Trash className="size-3.5" />
                  Delete
                </Button>
              )}
            </div>
          </div>
          {selectedTeam.leader && (
            <div className="mt-2 flex items-center gap-2">
              <Avatar size="sm">
                {selectedTeam.leader.user.image ? (
                  <AvatarImage src={selectedTeam.leader.user.image} alt={selectedTeam.leader.user.name} />
                ) : null}
                <AvatarFallback>{selectedTeam.leader.user.name?.charAt(0)?.toUpperCase() ?? "?"}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                Led by <span className="font-medium text-foreground">{selectedTeam.leader.user.name}</span>
              </span>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-foreground">
              Members ({selectedTeam.members.length})
            </h2>
            <Dialog
              open={addMemberTeamId === selectedTeam.id}
              onOpenChange={(o) => setAddMemberTeamId(o ? selectedTeam.id : null)}
            >
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={!canManageTeam(selectedTeam)}>
                  <UserPlus className="size-3.5" />
                  Add member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add member to {selectedTeam.name}</DialogTitle>
                  <DialogDescription>Select an org member to add.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddMember}>
                  <Field>
                    <FieldLabel>Member</FieldLabel>
                    <Controller
                      control={addMemberForm.control}
                      name="userId"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a member..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableMembers(selectedTeam.id).length === 0 ? (
                              <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                                All members already in this team.
                              </div>
                            ) : (
                              getAvailableMembers(selectedTeam.id).map((m) => (
                                <SelectItem key={m.userId} value={m.userId}>
                                  {m.user.name} ({m.user.email})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldError>{addMemberForm.formState.errors.userId?.message}</FieldError>
                  </Field>
                  <DialogFooter className="mt-4">
                    <Button variant="outline" type="button" onClick={() => setAddMemberTeamId(null)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="rounded-none border border-border">
            {selectedTeam.members.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
                No members in this team yet.
              </div>
            ) : (
              selectedTeam.members.map((tm, idx) => {
                const isLeader = selectedTeam.leader?.user?.id === tm.user.id
                return (
                  <div
                    key={tm.id}
                    className={`flex items-center gap-3 px-4 py-3 ${idx < selectedTeam.members.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <Avatar size="sm">
                      {tm.user.image ? (
                        <AvatarImage src={tm.user.image} alt={tm.user.name} />
                      ) : null}
                      <AvatarFallback>{tm.user.name?.charAt(0)?.toUpperCase() ?? "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {tm.user.name}
                        {isLeader && (
                          <span className="ml-1.5 text-xs text-muted-foreground font-normal">(leader)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{tm.user.email}</p>
                    </div>
                    {!isLeader && canManageTeam(selectedTeam) && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveMember(selectedTeam.id, tm.userId)}
                        disabled={removing === tm.userId}
                      >
                        <Trash className="size-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
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

  // List view
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Teams</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organize members into teams with leaders.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-3.5" />
              Create team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create team</DialogTitle>
              <DialogDescription>Create a new team within this organization.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTeam}>
              <div className="space-y-4">
                <Field>
                  <FieldLabel>Team name</FieldLabel>
                  <Controller
                    control={createForm.control}
                    name="name"
                    render={({ field }) => <Input {...field} placeholder="Engineering" />}
                  />
                  <FieldError>{createForm.formState.errors.name?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel>Team leader</FieldLabel>
                  <Controller
                    control={createForm.control}
                    name="leaderUserId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a team leader..." />
                        </SelectTrigger>
                        <SelectContent>
                          {orgMembers.map((m) => (
                            <SelectItem key={m.userId} value={m.userId}>
                              {m.user.name} ({m.user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError>{createForm.formState.errors.leaderUserId?.message}</FieldError>
                </Field>
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        {teams.length === 0 ? (
          <div className="border border-border p-8 text-center text-xs text-muted-foreground">
            <UsersIcon className="size-8 mx-auto mb-2 opacity-40" />
            No teams yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className="border border-border p-4 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-foreground truncate">{team.name}</h3>
                </div>
                {team.leader && (
                  <div className="mt-3 flex items-center gap-1.5">
                    <Avatar size="sm">
                      {team.leader.user.image ? (
                        <AvatarImage src={team.leader.user.image} alt={team.leader.user.name} />
                      ) : null}
                      <AvatarFallback className="text-[10px]">
                        {team.leader.user.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground truncate">{team.leader.user.name}</span>
                  </div>
                )}
                <div className="mt-2">
                  <Badge variant="outline" className="text-[10px]">
                    {team.members.length} {team.members.length === 1 ? "member" : "members"}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
