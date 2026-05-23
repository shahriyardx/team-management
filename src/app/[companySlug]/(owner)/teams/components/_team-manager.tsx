"use client"

import { useCallback, useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Plus,
  Trash,
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
import { useOrganization } from "@/lib/organization-context"
import { useMemberRole } from "@/lib/use-member-role"
import { api } from "@/lib/trpc/client"
import { authClient } from "@/lib/auth-client"
import { useRouter, useParams } from "next/navigation"

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

export function TeamManager() {
  const router = useRouter()
  const params = useParams()
  const companySlug = params.companySlug as string
  const { session, organization } = useOrganization()
  const { role, loading: roleLoading } = useMemberRole()
  const canManage = role === "owner" || role === "admin"
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const { data: teamsData, isLoading, refetch } = api.team.list.useQuery(
    { organizationId: organization?.id ?? "" },
    { enabled: !!organization },
  )
  const teams = ((teamsData?.teams ?? []) as Team[]).filter((t) => t.name !== organization?.name)

  const setLeader = api.team.setLeader.useMutation({
    onSuccess: () => refetch(),
  })

  const setActiveTeamMutation = api.team.setActiveTeam.useMutation()

  const loadOrgMembers = useCallback(async () => {
    if (!organization) return
    const res = await authClient.organization.listMembers({
      query: { organizationSlug: organization.slug },
    })
    const members = (res.data?.members ?? []) as OrgMember[]
    setOrgMembers(members)
  }, [organization, session?.user?.id])

  useEffect(() => {
    if (organization) loadOrgMembers()
  }, [organization, loadOrgMembers])

  const createForm = useForm<CreateTeamForm>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: "", description: "", leaderUserId: "" },
  })

  useEffect(() => {
    if (createOpen) createForm.reset({ name: "", description: "", leaderUserId: "" })
  }, [createOpen, createForm])

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

      const leaderMember = orgMembers.find((m) => m.userId === data.leaderUserId)
      if (!leaderMember) throw new Error("Leader not found in org")

      await setLeader.mutateAsync({
        teamId: betterTeam.id,
        leaderMemberId: leaderMember.id,
      })

      setCreateOpen(false)
      refetch()
    } catch {} finally {
      setCreating(false)
    }
  })

  if (roleLoading || isLoading) {
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

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
              <div key={team.id} className="border border-border p-4 hover:bg-muted/30 transition-colors">
                <button
                  onClick={() => router.push(`/${companySlug}/teams/${team.id}`)}
                  className="w-full text-left"
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
                <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                  <Button
                    size="sm"
                    variant="default"
                    className="text-xs"
                    onClick={async () => {
                      await setActiveTeamMutation.mutateAsync({ teamId: team.id, organizationId: organization?.id ?? "" })
                      window.location.href = `/${companySlug}/manage-team`
                    }}
                  >
                    Manage
                  </Button>
                  {canManage && (
                    <>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs"
                        onClick={() => setDeleteConfirmId(team.id)}
                      >
                        <Trash className="size-3" />
                        Delete
                      </Button>
                      <Dialog open={deleteConfirmId === team.id} onOpenChange={(o) => { if (!o) setDeleteConfirmId(null) }}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete team</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete <span className="font-medium text-foreground">{team.name}</span>? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
                            <Button variant="destructive" onClick={async () => {
                              try {
                                await authClient.organization.removeTeam({ teamId: team.id })
                                setDeleteConfirmId(null)
                                refetch()
                              } catch {}
                            }}>Delete</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
