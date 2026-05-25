import { Suspense } from "react"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-sm mx-auto text-sm text-muted-foreground">
          Loading...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
