"use client"

import { cn } from "@/lib/utils"

const statusColors: Record<string, string> = {
  achieved: "bg-emerald-500",
  completed: "bg-emerald-500",
  on_track: "bg-sky-500",
  at_risk: "bg-amber-400",
  behind: "bg-red-400",
  not_started: "bg-muted-foreground/30",
}

interface ProgressBarProps {
  value: number
  size?: "sm" | "md" | "lg"
  status?: string
  showLabel?: boolean
}

export function ProgressBar({
  value,
  size = "md",
  status,
  showLabel,
}: ProgressBarProps) {
  const height = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2"
  const barColor = status
    ? (statusColors[status] ?? "bg-muted-foreground/30")
    : "bg-muted-foreground/30"

  return (
    <div className="flex items-center gap-2">
      <div className={cn("flex-1 rounded-none bg-muted", height)}>
        <div
          className={cn(
            "h-full rounded-none transition-all duration-300",
            barColor,
          )}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
          {value}%
        </span>
      )}
    </div>
  )
}
