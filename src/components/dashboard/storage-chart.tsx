"use client"

import { Pie, PieChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Props {
  storageUsed: number
  storageLimit: number
}

const chartConfig = {
  used: {
    label: "Used",
    color: "hsl(var(--foreground))",
  },
  remaining: {
    label: "Remaining",
    color: "hsl(var(--muted))",
  },
}

export function StorageChart({ storageUsed, storageLimit }: Props) {
  const remaining = Math.max(0, storageLimit - storageUsed)
  const usedPct = ((storageUsed / storageLimit) * 100).toFixed(1)

  const data = [
    { name: "used", value: storageUsed, fill: "hsl(var(--foreground))" },
    { name: "remaining", value: remaining, fill: "hsl(var(--muted))" },
  ]

  const empty = storageUsed === 0

  return (
    <Card size="sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">Storage</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[180px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <Pie
              data={empty ? [{ name: "remaining", value: 1, fill: "hsl(var(--muted))" }] : data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={75}
              strokeWidth={0}
            />
          </PieChart>
        </ChartContainer>
        <div className="text-center mt-1">
          <p className="text-lg font-semibold tabular-nums">{usedPct}%</p>
          <p className="text-[11px] text-muted-foreground">
            {formatBytes(storageUsed)} / {formatBytes(storageLimit)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
