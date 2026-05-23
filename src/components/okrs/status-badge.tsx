"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  not_started: "outline",
  on_track: "default",
  at_risk: "secondary",
  behind: "destructive",
  achieved: "default",
  completed: "default",
}

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      variant={statusVariant[status] ?? "outline"}
      className={cn(
        "text-[10px]",
        status === "completed" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        status === "at_risk" && "bg-amber-500/10 text-amber-500 border-amber-500/20",
        status === "on_track" && "bg-sky-500/10 text-sky-500 border-sky-500/20",
      )}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  )
}
