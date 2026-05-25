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

const editSchema = z.object({
  title: z.string().min(1, "Title is required."),
})

type EditForm = z.infer<typeof editSchema>

interface EditObjectiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTitle: string
  onSubmit: (data: EditForm) => void
  isPending: boolean
}

export function EditObjectiveDialog({
  open,
  onOpenChange,
  defaultTitle,
  onSubmit,
  isPending,
}: EditObjectiveDialogProps) {
  const form = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { title: defaultTitle },
  })

  useEffect(() => {
    if (open) form.reset({ title: defaultTitle })
  }, [open, defaultTitle, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit objective title</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Field>
              <FieldLabel>Title</FieldLabel>
              <Controller
                control={form.control}
                name="title"
                render={({ field }) => (
                  <Input {...field} placeholder="Objective title" autoFocus />
                )}
              />
              <FieldError>{form.formState.errors.title?.message}</FieldError>
            </Field>
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
