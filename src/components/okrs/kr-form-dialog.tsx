"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

const krSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().optional(),
  targetValue: z.coerce.number().min(0.01, "Target must be greater than 0"),
  maxValue: z.coerce.number().nullable().optional(),
  currentValue: z.coerce.number().min(0).default(0),
  unit: z.string().min(1),
  weight: z.coerce.number().min(0).default(1),
})
export type KrForm = z.infer<typeof krSchema>

interface KrFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  defaultValues?: Partial<KrForm>
  onSubmit: (data: KrForm) => void
  isPending: boolean
}

export function KrFormDialog({ open, onOpenChange, mode, defaultValues, onSubmit, isPending }: KrFormDialogProps) {
  const form = useForm<KrForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(krSchema) as any,
    defaultValues: { title: "", description: "", targetValue: 0, currentValue: 0, maxValue: null, unit: "number", weight: 1, ...defaultValues },
  })

  useEffect(() => {
    if (open) {
      form.reset({ title: "", description: "", targetValue: 0, currentValue: 0, unit: "number", weight: 1, ...defaultValues })
    }
  }, [open, form, defaultValues])

  const unitVal = form.watch("unit")
  const maxVal = form.watch("maxValue")

  // Auto-set target to 1 for boolean, hide the input
  useEffect(() => {
    if (unitVal === "boolean") {
      form.setValue("targetValue", 1)
    }
  }, [unitVal, form])

  const handleSubmit = form.handleSubmit(onSubmit)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add key result" : "Edit key result"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Field>
              <FieldLabel>Title</FieldLabel>
              <Controller control={form.control} name="title" render={({ field }) => <Input {...field} placeholder="Increase NPS score" />} />
              <FieldError>{form.formState.errors.title?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Description (optional)</FieldLabel>
              <Controller control={form.control} name="description" render={({ field }) => <Textarea {...field} rows={2} />} />
            </Field>
            <div className={unitVal === "boolean" ? "grid grid-cols-1 gap-4" : "grid grid-cols-2 gap-4"}>
              {unitVal !== "boolean" && (
                <Field>
                  <FieldLabel>Target value</FieldLabel>
                  <Controller control={form.control} name="targetValue" render={({ field }) => (
                    <Input type="number" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? "" : e.target.valueAsNumber)} step="any" />
                  )} />
                  <FieldError>{form.formState.errors.targetValue?.message}</FieldError>
                </Field>
              )}
              <Field>
                <FieldLabel>Current value</FieldLabel>
                {unitVal === "boolean" ? (
                  <Controller control={form.control} name="currentValue" render={({ field }) => (
                    <Switch checked={(field.value ?? 0) === 1} onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)} />
                  )} />
                ) : unitVal === "number" || unitVal === "currency" ? (
                  <div className="space-y-2">
                    <Controller control={form.control} name="currentValue" render={({ field }) => (
                      <Input type="number" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? "" : e.target.valueAsNumber)} step="any" />
                    )} />
                    {maxVal != null && maxVal > 0 && (
                      <Controller control={form.control} name="currentValue" render={({ field }) => (
                        <div className="flex items-center gap-3">
                          <Slider value={[field.value ?? 0]} onValueChange={([val]) => field.onChange(val)} min={0} max={maxVal ?? undefined} step={1} className="flex-1" />
                          <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{Math.round(field.value ?? 0)} / {Math.round(maxVal ?? 0)}</span>
                        </div>
                      )} />
                    )}
                  </div>
                ) : unitVal === "percentage" ? (
                  <Controller control={form.control} name="currentValue" render={({ field }) => (
                    <div className="flex items-center gap-3">
                      <Slider value={[field.value ?? 0]} onValueChange={([val]) => field.onChange(val)} min={0} max={100} step={1} className="flex-1" />
                      <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{Math.round(field.value ?? 0)}%</span>
                    </div>
                  )} />
                ) : (
                  <Controller control={form.control} name="currentValue" render={({ field }) => (
                    <Input type="number" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? "" : e.target.valueAsNumber)} step="any" />
                  )} />
                )}
                <FieldError>{form.formState.errors.currentValue?.message}</FieldError>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Unit</FieldLabel>
                <Controller control={form.control} name="unit" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-8 w-full rounded-none text-xs">{field.value}</SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="currency">Currency</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </Field>
              <Field>
                <FieldLabel>Weight</FieldLabel>
                <Controller control={form.control} name="weight" render={({ field }) => (
                  <Input type="number" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? "" : e.target.valueAsNumber)} step="0.1" min="0" />
                )} />
              </Field>
            </div>
            {(unitVal === "number" || unitVal === "currency") && (
              <Field>
                <FieldLabel>Max value (optional)</FieldLabel>
                <Controller control={form.control} name="maxValue" render={({ field }) => (
                  <Input type="number" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? "" : e.target.valueAsNumber)} step="any" min="0" placeholder="Sets slider range" />
                )} />
              </Field>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : mode === "create" ? "Create" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
