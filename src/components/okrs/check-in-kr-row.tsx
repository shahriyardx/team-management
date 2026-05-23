"use client"

import { useCallback, useState } from "react"
import { format } from "date-fns"
import { ArrowCircleUp, CaretDown, CaretRight, Lock } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProgressBar } from "@/components/okrs/progress-bar"
import { CheckInDialog } from "@/components/okrs/check-in-dialog"
import { api } from "@/lib/trpc/client"
import { useOrganization } from "@/lib/organization-context"

interface CheckInKr {
  id: string
  title: string
  description?: string | null
  progress: number
  currentValue: number
  targetValue: number
  maxValue: number | null
  unit: string
  status: string
}

interface CheckInKrRowProps {
  kr: CheckInKr
  cycleId: string
  locked?: boolean
}

export function CheckInKrRow({ kr, cycleId, locked }: CheckInKrRowProps) {
  const { organization } = useOrganization()
  const [expanded, setExpanded] = useState(false)
  const toggle = useCallback(() => setExpanded((p) => !p), [])

  const { data: checkInsData } = api.checkIn.list.useQuery(
    { keyResultId: kr.id, organizationId: organization?.id ?? "", skip: 0, take: 20 },
    { enabled: expanded && !!organization },
  )
  const checkIns = (checkInsData?.checkIns ?? []) as Array<{
    id: string
    previousValue: number
    newValue: number
    note: string | null
    createdAt: string
    author: { user: { id: string; name: string; email: string; image?: string | null } }
  }>

  const [checkInKr, setCheckInKr] = useState<{
    id: string
    title: string
    currentValue: number
    targetValue: number
    maxValue: number | null
    unit: string
  } | null>(null)

  return (
    <>
      <div className="border border-muted-foreground/20 border-l-2 border-l-amber-500/30 px-3 py-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <button
                onClick={toggle}
                className="flex items-center gap-1 cursor-pointer"
              >
                {expanded
                  ? <CaretDown className="size-3 text-muted-foreground" />
                  : <CaretRight className="size-3 text-muted-foreground" />}
                <span className="text-xs font-medium">{kr.title}</span>
              </button>
              <Badge variant="outline" className="text-[10px]">
                {kr.unit}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <ProgressBar value={kr.progress} size="sm" status={kr.status} />
              <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                {kr.currentValue} / {kr.targetValue}
              </span>
            </div>
          </div>
          {locked ? (
            <Badge variant="outline" className="ml-3 shrink-0 text-[10px] text-amber-600 border-amber-300 bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:bg-amber-950/30">
              <Lock className="size-2.5 mr-0.5" />
              Locked
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCheckInKr({
                  id: kr.id,
                  title: kr.title,
                  currentValue: kr.currentValue,
                  targetValue: kr.targetValue,
                  maxValue: kr.maxValue,
                  unit: kr.unit,
                })
              }
              className="shrink-0 self-start"
            >
              <ArrowCircleUp className="mr-1 size-3.5" />
              Check in
            </Button>
          )}
        </div>
        {expanded && (
          <div className="mt-2 border-t border-border pt-2 space-y-2">
            {kr.description && (
              <p className="text-xs text-muted-foreground">{kr.description}</p>
            )}
            {checkInsData && checkIns.length > 0 && (
              <div className="space-y-1.5">
                {checkIns.map((ci) => (
                  <div key={ci.id} className="flex items-start gap-2 text-[11px]">
                    <Badge variant="outline" className="shrink-0 text-[10px] whitespace-nowrap">
                      {ci.previousValue} → {ci.newValue}
                    </Badge>
                    <div className="min-w-0 leading-tight">
                      {ci.note && <span className="text-muted-foreground">{ci.note}</span>}
                      <span className="text-muted-foreground/50">
                        {" "}– {ci.author.user.name}
                      </span>
                      <span className="text-muted-foreground/30 ml-1">
                        {format(new Date(ci.createdAt), "MMM d")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {checkInsData && checkIns.length === 0 && !kr.description && (
              <p className="text-[11px] text-muted-foreground/50">No check-ins yet.</p>
            )}
          </div>
        )}
      </div>

      <CheckInDialog
        open={!!checkInKr}
        onOpenChange={(o) => { if (!o) setCheckInKr(null) }}
        cycleId={cycleId}
        kr={checkInKr}
      />
    </>
  )
}
