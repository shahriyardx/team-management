"use client"

import { useCallback, useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  CaretDown,
  EnvelopeSimple,
  House,
  SignOut,
  Sparkle,
  UserPlus,
  X,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useOrganization } from "@/lib/organization-context"
import { authClient } from "@/lib/auth-client"

type Member = {
  id: string
  userId: string
  role: string
  user: { id: string; name: string; email: string; image: string | null | undefined }
}

type Invitation = {
  id: string
  email: string
  role: string
  status: string
  inviterId: string
  expiresAt: Date
  createdAt: Date
}

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  role: z.enum(["admin", "member"]),
})

type InviteForm = z.infer<typeof inviteSchema>

export default function MembersPage() {
  const { session, organization } = useOrganization()

  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  // Invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false)

  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "member" },
  })

  // Action tracking state
  const [changingRole, setChangingRole] = useState<string | null>(null)
  const [removingMember, setRemovingMember] = useState<string | null>(null)

  const canManage = currentUserRole === "owner" || currentUserRole === "admin"

  const loadData = useCallback(async () => {
    if (!organization) return
    try {
      const [membersRes, invitationsRes] = await Promise.all([
        authClient.organization.listMembers({ query: { organizationSlug: organization.slug } }),
        authClient.organization.listInvitations({ query: { organizationId: organization.id } }),
      ])
      const membersData = membersRes.data?.members ?? []
      const invitationsData = (invitationsRes.data as Invitation[]) ?? []
      setMembers(membersData)
      setInvitations(invitationsData.filter((inv) => inv.status === "pending"))

      if (session?.user?.id) {
        const me = membersData.find((m: Member) => m.userId === session.user.id)
        if (me) setCurrentUserRole(me.role)
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false)
    }
  }, [organization, session?.user?.id])

  useEffect(() => {
    if (organization) loadData()
  }, [organization, loadData])

  const onInvite = useCallback(async (data: InviteForm) => {
    if (!organization) return
    try {
      await authClient.organization.inviteMember({
        email: data.email,
        role: data.role,
        organizationId: organization.id,
      })
      setInviteOpen(false)
      form.reset()
      loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send invitation."
      form.setError("email", { message: msg })
    }
  }, [organization, form, loadData])

  const handleCancelInvitation = useCallback(
    async (invitationId: string) => {
      try {
        await authClient.organization.cancelInvitation({ invitationId })
        loadData()
      } catch {
        // silently handle
      }
    },
    [loadData],
  )

  const handleRemoveMember = useCallback(
    async (memberId: string) => {
      if (!organization) return
      setRemovingMember(memberId)
      try {
        await authClient.organization.removeMember({
          memberIdOrEmail: memberId,
          organizationId: organization.id,
        })
        loadData()
      } catch {
        // silently handle
      } finally {
        setRemovingMember(null)
      }
    },
    [organization, loadData],
  )

  const handleUpdateRole = useCallback(
    async (memberId: string, role: "admin" | "member") => {
      if (!organization) return
      setChangingRole(memberId)
      try {
        await authClient.organization.updateMemberRole({
          memberId,
          role,
          organizationId: organization.id,
        })
        loadData()
      } catch {
        // silently handle
      } finally {
        setChangingRole(null)
      }
    },
    [organization, loadData],
  )

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  const pendingInvitations = invitations.filter((inv) => inv.status === "pending")

  return (
    <div className="flex flex-1 flex-col gap-8 p-6">
      {/* Title + Invite button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Members</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage who has access to this organization.
          </p>
        </div>
        {canManage && (
          <Dialog open={inviteOpen} onOpenChange={(open) => { setInviteOpen(open); if (open) form.reset() }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="size-3.5" />
                Invite member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join this organization.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="invite-email">Email address</FieldLabel>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="partner@acme.com"
                    {...form.register("email")}
                    disabled={form.formState.isSubmitting}
                  />
                  {form.formState.errors.email && (
                    <FieldError errors={[form.formState.errors.email]} />
                  )}
                </Field>

                <Field>
                  <FieldLabel>Role</FieldLabel>
                  <Controller
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={form.formState.isSubmitting}>
                        <SelectTrigger className="h-9 w-full rounded-none text-xs">
                          {field.value === "member" ? "Member" : "Admin"}
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setInviteOpen(false)}
                  disabled={form.formState.isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={form.handleSubmit(onInvite)} disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Sending..." : "Send invitation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Members list */}
      <div>
        <h2 className="text-xs font-medium text-foreground mb-3">
          Active members
        </h2>
        <div className="rounded-none border border-border">
          {members.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
              No members found.
            </div>
          ) : (
            <div>
              {members.map((member, idx) => (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    idx < members.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <Avatar size="sm">
                    {member.user.image ? (
                      <AvatarImage src={member.user.image} alt={member.user.name} />
                    ) : null}
                    <AvatarFallback>
                      {member.user.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {member.user.name}
                      {member.userId === session?.user?.id && (
                        <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                          (you)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.user.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        member.role === "owner"
                          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-800"
                          : member.role === "admin"
                            ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:ring-blue-800"
                            : "bg-muted text-muted-foreground ring-1 ring-border"
                      }`}
                    >
                      {member.role}
                    </span>

                    {/* Actions dropdown */}
                    {canManage && member.role !== "owner" && member.userId !== session?.user?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <CaretDown className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-32">
                          {currentUserRole === "owner" && (
                            <>
                              {member.role !== "admin" && (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateRole(member.id, "admin")}
                                  disabled={changingRole === member.id}
                                >
                                  <Sparkle className="size-3.5" />
                                  Make admin
                                </DropdownMenuItem>
                              )}
                              {member.role !== "member" && (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateRole(member.id, "member")}
                                  disabled={changingRole === member.id}
                                >
                                  <House className="size-3.5" />
                                  Make member
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                          {currentUserRole === "admin" && member.role === "member" && (
                            <DropdownMenuItem
                              onClick={() => handleUpdateRole(member.id, "admin")}
                              disabled={changingRole === member.id}
                            >
                              <Sparkle className="size-3.5" />
                              Make admin
                            </DropdownMenuItem>
                          )}
                          {(currentUserRole === "owner" ||
                            (currentUserRole === "admin" && member.role === "member")) && (
                            <DropdownMenuSeparator />
                          )}
                          <DropdownMenuItem
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={removingMember === member.id}
                            variant="destructive"
                          >
                            <SignOut className="size-3.5" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending invitations */}
      {canManage && pendingInvitations.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-foreground mb-3">
            Pending invitations
          </h2>
          <div className="rounded-none border border-border">
            {pendingInvitations.map((inv, idx) => (
              <div
                key={inv.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  idx < pendingInvitations.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex size-6 items-center justify-center rounded-full bg-muted">
                  <EnvelopeSimple className="size-3 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {inv.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Invited as {inv.role}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleCancelInvitation(inv.id)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
