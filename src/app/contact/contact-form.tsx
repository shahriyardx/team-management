"use client"

import { useCallback } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useActionState, startTransition } from "react"
import { submitContact } from "./actions"

const contactSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().min(1, "Email is required.").email("Invalid email address."),
  subject: z.string().min(1, "Subject is required."),
  message: z.string().min(1, "Message is required."),
})

type ContactFormData = z.infer<typeof contactSchema>

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContact, null)

  const { control, handleSubmit } = useForm<ContactFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(contactSchema) as any,
    defaultValues: { name: "", email: "", subject: "", message: "" },
  })

  const onSubmit = useCallback(
    (data: ContactFormData) => {
      const fd = new FormData()
      fd.set("name", data.name)
      fd.set("email", data.email)
      fd.set("subject", data.subject)
      fd.set("message", data.message)
      startTransition(() => formAction(fd))
    },
    [formAction],
  )

  if (state?.success) {
    return (
      <div className="mt-6 text-center py-12">
        <div className="inline-flex size-12 items-center justify-center rounded-full bg-emerald-500/10 mb-4">
          <Check className="size-6 text-emerald-500" />
        </div>
        <p className="text-sm text-muted-foreground">
          Thanks for reaching out. We'll get back to you within 24 hours.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input {...field} placeholder="Your name" />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input {...field} type="email" placeholder="you@company.com" />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />
      </div>
      <Controller
        control={control}
        name="subject"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Subject</FieldLabel>
            <Input {...field} placeholder="What is this about?" />
            <FieldError>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />
      <Controller
        control={control}
        name="message"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Message</FieldLabel>
            <Textarea {...field} rows={5} placeholder="Tell us more..." />
            <FieldError>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />
      {state?.error && (
        <p className="text-xs text-red-500">{state.error}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending..." : "Send message"}
        <ArrowRight className="size-3" />
      </Button>
    </form>
  )
}
