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

const editCycleSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required."),
  endDate: z.string().min(1, "End date is required."),
})

type EditCycleForm = z.infer<typeof editCycleSchema>

interface EditCycleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues: {
    title: string
    description: string | null
    startDate: string
    endDate: string
  }
  onSubmit: (data: EditCycleForm) => void
  isPending: boolean
}

function toDateInputValue(dateStr: string) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toISOString().split("T")[0]
}

export function EditCycleDialog({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  isPending,
}: EditCycleDialogProps) {
  const form = useForm<EditCycleForm>({
    resolver: zodResolver(editCycleSchema),
    defaultValues: {
      title: defaultValues.title,
      description: defaultValues.description ?? "",
      startDate: toDateInputValue(defaultValues.startDate),
      endDate: toDateInputValue(defaultValues.endDate),
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        title: defaultValues.title,
        description: defaultValues.description ?? "",
        startDate: toDateInputValue(defaultValues.startDate),
        endDate: toDateInputValue(defaultValues.endDate),
      })
    }
  }, [open, defaultValues, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit cycle</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Field>
              <FieldLabel>Title</FieldLabel>
              <Controller
                control={form.control}
                name="title"
                render={({ field }) => (
                  <Input {...field} placeholder="Q1 2026" autoFocus />
                )}
              />
              <FieldError>{form.formState.errors.title?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Description (optional)</FieldLabel>
              <Controller
                control={form.control}
                name="description"
                render={({ field }) => <Textarea {...field} rows={2} />}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Start date</FieldLabel>
                <Controller
                  control={form.control}
                  name="startDate"
                  render={({ field }) => <Input {...field} type="date" />}
                />
                <FieldError>
                  {form.formState.errors.startDate?.message}
                </FieldError>
              </Field>
              <Field>
                <FieldLabel>End date</FieldLabel>
                <Controller
                  control={form.control}
                  name="endDate"
                  render={({ field }) => <Input {...field} type="date" />}
                />
                <FieldError>
                  {form.formState.errors.endDate?.message}
                </FieldError>
              </Field>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
