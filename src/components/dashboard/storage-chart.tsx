import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HardDrives } from "@phosphor-icons/react"

interface Props {
  storageUsed: number
  storageLimit: number
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function StorageChart({ storageUsed, storageLimit }: Props) {
  const usedPct = Math.min((storageUsed / storageLimit) * 100, 100)

  return (
    <Card size="sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <HardDrives className="size-4 text-muted-foreground" />
          Storage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="h-2 w-full overflow-hidden bg-muted">
            <div
              className="h-full bg-foreground transition-all"
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium tabular-nums">
              {usedPct.toFixed(1)}% used
            </span>
            <span className="text-muted-foreground tabular-nums">
              {formatBytes(storageUsed)} / {formatBytes(storageLimit)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
