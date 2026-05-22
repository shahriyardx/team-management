"use client"

import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/trpc/client"
import { useOrganization } from "@/lib/organization-context"

const checkInSchema = z.object({
  newValue: z.coerce.number().min(0, "Value must be at least 0"),
  note: z.string().optional(),
})
type CheckInForm = z.infer<typeof checkInSchema>

interface CheckInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cycleId: string
  kr: {
    id: string
    title: string
    currentValue: number
    targetValue: number
    maxValue: number | null
    unit: string
  } | null
}

export function CheckInDialog({ open, onOpenChange, cycleId, kr }: CheckInDialogProps) {
  const { organization } = useOrganization()
  const utils = api.useUtils()

  const form = useForm<CheckInForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(checkInSchema) as any,
    defaultValues: { newValue: kr?.currentValue ?? 0, note: "" },
  })

  useEffect(() => {
    if (open && kr) {
      form.reset({ newValue: kr.currentValue, note: "" })
    }
  }, [open, kr, form])

  const checkInMutation = api.checkIn.create.useMutation({
    onSuccess: () => {
      utils.objective.list.invalidate({ cycleId })
      onOpenChange(false)
      form.reset()
    },
  })

  const handleSubmit = form.handleSubmit((data) => {
    if (!kr || !organization) return
    checkInMutation.mutate({
      keyResultId: kr.id,
      newValue: data.newValue,
      note: data.note || null,
      organizationId: organization.id,
    })
  })

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onOpenChange(false) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check-in: {kr?.title}</DialogTitle>
          <DialogDescription>
            Current value: {kr?.currentValue} {kr?.unit}. Target: {kr?.targetValue} {kr?.unit}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Field>
              <FieldLabel>New value</FieldLabel>
              {kr?.unit === "boolean" ? (
                <Controller control={form.control} name="newValue" render={({ field }) => (
                  <Switch checked={(field.value ?? 0) === 1} onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)} />
                )} />
              ) : kr?.unit === "percentage" ? (
                <Controller control={form.control} name="newValue" render={({ field }) => (
                  <div className="flex items-center gap-3">
                    <Slider value={[field.value ?? 0]} onValueChange={([val]) => field.onChange(val)} min={0} max={100} step={1} className="flex-1" />
                    <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{Math.round(field.value ?? 0)}%</span>
                  </div>
                )} />
              ) : kr?.unit === "number" || kr?.unit === "currency" ? (
                <div className="space-y-2">
                  <Controller control={form.control} name="newValue" render={({ field }) => (
                    <Input type="number" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? "" : e.target.valueAsNumber)} step="any" />
                  )} />
                  {kr?.maxValue != null && kr.maxValue > 0 && (
                    <Controller control={form.control} name="newValue" render={({ field }) => (
                      <div className="flex items-center gap-3">
                        <Slider value={[field.value ?? 0]} onValueChange={([val]) => field.onChange(val)} min={0} max={kr.maxValue ?? undefined} step={1} className="flex-1" />
                        <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{Math.round(field.value ?? 0)} / {Math.round(kr.maxValue ?? 0)}</span>
                      </div>
                    )} />
                  )}
                </div>
              ) : (
                <Controller control={form.control} name="newValue" render={({ field }) => (
                  <Input type="number" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? "" : e.target.valueAsNumber)} step="any" />
                )} />
              )}
              <FieldError>{form.formState.errors.newValue?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Note (optional)</FieldLabel>
              <Controller control={form.control} name="note" render={({ field }) => <Textarea {...field} rows={2} placeholder="Brief update on progress..." />} />
            </Field>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={checkInMutation.isPending}>{checkInMutation.isPending ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
