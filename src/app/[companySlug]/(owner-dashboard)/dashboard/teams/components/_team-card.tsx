"use client"

import { useState } from "react"
import { Trash } from "@phosphor-icons/react"
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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/trpc/client"
import { useRouter } from "next/navigation"

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

interface TeamCardProps {
  team: Team
  companySlug: string
  sessionUserId: string | undefined
  organizationId: string
  canDelete: boolean
  onDeleted: () => void
}

export function TeamCard({
  team,
  companySlug,
  sessionUserId,
  organizationId,
  canDelete,
  onDeleted,
}: TeamCardProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmName, setConfirmName] = useState("")
  const [deleteError, setDeleteError] = useState("")

  const setActiveTeamMutation = api.team.setActiveTeam.useMutation()

  return (
    <div className="flex flex-col h-full border border-border p-4">
      <div className="flex-1 pb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-foreground truncate">
            {team.name}
          </h3>
        </div>
        {team.leader && (
          <div className="mt-3 flex items-center gap-1.5">
            <Avatar size="sm">
              {team.leader.user.image ? (
                <AvatarImage
                  src={team.leader.user.image}
                  alt={team.leader.user.name}
                />
              ) : null}
              <AvatarFallback className="text-[10px]">
                {team.leader.user.name?.charAt(0)?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {team.leader.user.name}
            </span>
          </div>
        )}
        <div className="mt-2">
          <Badge variant="outline" className="text-[10px]">
            {team.members.length}{" "}
            {team.members.length === 1 ? "member" : "members"}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-border pt-3">
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() =>
            router.push(`/${companySlug}/dashboard/teams/${team.id}`)
          }
        >
          View
        </Button>
        <Button
          size="sm"
          variant="default"
          className="text-xs"
          onClick={async () => {
            await setActiveTeamMutation.mutateAsync({
              teamId: team.id,
              organizationId,
            })
            const isLeader = team.leader?.user?.id === sessionUserId
            if (isLeader) window.location.href = `/${companySlug}/manage-team`
            else router.push(`/${companySlug}/team`)
          }}
        >
          Manage
        </Button>
        {canDelete && (
          <>
            <Button
              size="sm"
              variant="destructive"
              className="text-xs"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash className="size-3" />
              Delete
            </Button>
            <Dialog
              open={deleteOpen}
              onOpenChange={(o) => {
                if (!o) {
                  setDeleteOpen(false)
                  setConfirmName("")
                  setDeleteError("")
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete team</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. Type{" "}
                    <span className="font-medium text-foreground">
                      {team.name}
                    </span>{" "}
                    to confirm.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 px-2">
                  <Input
                    value={confirmName}
                    onChange={(e) => {
                      setConfirmName(e.target.value)
                      setDeleteError("")
                    }}
                    placeholder={team.name}
                    className="text-xs"
                  />
                  {deleteError && (
                    <p className="text-xs text-destructive">{deleteError}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeleteOpen(false)
                      setConfirmName("")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={confirmName !== team.name}
                    onClick={async () => {
                      const { error } =
                        await authClient.organization.removeTeam({
                          teamId: team.id,
                          organizationId,
                        })
                      if (error) {
                        setDeleteError(error.message ?? "Failed to delete team")
                      } else {
                        onDeleted()
                      }
                    }}
                  >
                    Delete team
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  )
}
