"use client"

import { useState } from "react"
import { Plus, Trash, Key, Fingerprint } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { authClient } from "@/lib/auth-client"

type Passkey = {
  id: string
  name: string | null
  createdAt: Date | null
  deviceType: string
}

export default function PasskeysPage() {
  const { data: passkeys, isPending, refetch } = authClient.useListPasskeys()
  const list = (passkeys ?? []) as unknown as Passkey[]

  const [adding, setAdding] = useState(false)
  const [addName, setAddName] = useState("")
  const [addError, setAddError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleAdd = async () => {
    setAddError(null)
    const res = await authClient.passkey.addPasskey({ name: addName || undefined })
    if (res.error) {
      setAddError(res.error.message ?? res.error.statusText ?? "Failed to add passkey.")
      return
    }
    setAdding(false)
    setAddName("")
    refetch()
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await authClient.$fetch("/passkey/delete-passkey", { method: "POST", body: { id } })
    setDeleting(null)
    refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Passkeys</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Passwordless login using device biometrics or security keys.</p>
        </div>
        <Button size="sm" onClick={() => { setAddName(""); setAddError(null); setAdding(true) }}>
          <Plus className="mr-1 size-3.5" />
          Add passkey
        </Button>
      </div>

      <div className="border border-border p-5">
        {isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-xs text-muted-foreground">
            <Key className="size-8" />
            <p>No passkeys registered yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {list.map((pk) => (
              <div key={pk.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Fingerprint className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{pk.name || "Unnamed passkey"}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {pk.deviceType === "platform" ? "Built-in authenticator" : "Security key"}
                      {pk.createdAt ? ` · Added ${pk.createdAt.toLocaleDateString()}` : ""}
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="icon-sm"
                  onClick={() => handleDelete(pk.id)}
                  disabled={deleting === pk.id}
                >
                  <Trash className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={adding} onOpenChange={(o) => !o && setAdding(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register passkey</DialogTitle>
            <DialogDescription>Your browser will prompt you to authenticate using your device biometrics or security key.</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="pk-name">Passkey name (optional)</FieldLabel>
            <Input id="pk-name" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="My MacBook" />
          </Field>
          {addError && <p className="text-xs text-destructive">{addError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!addName.trim()}>Register</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

