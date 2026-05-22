"use client"

import { useCallback, useMemo, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { Lock, LockOpen, PencilSimple, Plus, Trash } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"
import { EditCycleDialog } from "@/components/okrs/edit-cycle-dialog"

const months = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(0, i).toLocaleString("default", { month: "long" }),
}))

const cycleSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().optional(),
  cycleType: z.enum(["quarterly", "monthly", "custom"]),
  year: z.string().min(1),
  quarter: z.string().optional(),
  month: z.string().optional(),
  startMonth: z.string().optional(),
  endMonth: z.string().optional(),
})

type CycleForm = z.infer<typeof cycleSchema>

type OkrCycleItem = {
  id: string
  title: string
  status: string
  locked: boolean
  description: string | null
  cycleType: string
  startDate: string
  endDate: string
  _count: { objectives: number }
}

function formatCycleDate(c: OkrCycleItem) {
  const start = new Date(c.startDate)
  const end = new Date(c.endDate)
  if (c.cycleType === "quarterly") {
    return `${format(start, "MMMM")} – ${format(end, "MMMM")} ${format(start, "yyyy")}`
  }
  if (c.cycleType === "monthly") {
    return format(start, "MMMM yyyy")
  }
  return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`
}

export default function CyclesPage() {
  const { organization } = useOrganization()
  const utils = api.useUtils()

  const { data: cyclesData, isLoading } = api.okrCycle.list.useQuery(
    { organizationId: organization?.id ?? "", skip: 0, take: 50 },
    { enabled: !!organization },
  )
  const { data: activeCycleData } = api.okrCycle.getActive.useQuery(
    { organizationId: organization?.id ?? "" },
    { enabled: !!organization },
  )
  const cycles = (cyclesData?.cycles ?? []) as OkrCycleItem[]
  const activeCycle = activeCycleData?.cycle as OkrCycleItem | null
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()))

  const years = useMemo(() => {
    const cur = new Date().getFullYear()
    return Array.from({ length: cur - 2020 + 2 }, (_, i) => String(2020 + i)).reverse()
  }, [])

  // Create cycle
  const [cycleFormOpen, setCycleFormOpen] = useState(false)
  const cycleForm = useForm<CycleForm>({
    resolver: zodResolver(cycleSchema),
    defaultValues: {
      title: "", description: "", cycleType: "quarterly",
      year: String(new Date().getFullYear()), quarter: "Q1",
      month: "1", startMonth: "1", endMonth: "12",
    },
  })

  const cycleTypeVal = cycleForm.watch("cycleType")
  const cycleYearVal = cycleForm.watch("year")
  const cycleQuarterVal = cycleForm.watch("quarter")
  const cycleMonthVal = cycleForm.watch("month")
  const cycleStartMonthVal = cycleForm.watch("startMonth")
  const cycleEndMonthVal = cycleForm.watch("endMonth")

  const cycleDates = useMemo(() => {
    const year = Number.parseInt(cycleYearVal)
    if (!year) return { startDate: "", endDate: "" }
    if (cycleTypeVal === "quarterly") {
      const qMap: Record<string, [number, number]> = { Q1: [1, 3], Q2: [4, 6], Q3: [7, 9], Q4: [10, 12] }
      const [sm, em] = qMap[cycleQuarterVal ?? "Q1"] ?? [1, 3]
      return {
        startDate: `${year}-${String(sm).padStart(2, "0")}-01`,
        endDate: `${year}-${String(em).padStart(2, "0")}-${String(new Date(year, em, 0).getDate()).padStart(2, "0")}`,
      }
    }
    if (cycleTypeVal === "monthly") {
      const m = Number.parseInt(cycleMonthVal ?? "1")
      return {
        startDate: `${year}-${String(m).padStart(2, "0")}-01`,
        endDate: `${year}-${String(m).padStart(2, "0")}-${String(new Date(year, m, 0).getDate()).padStart(2, "0")}`,
      }
    }
    if (cycleTypeVal === "custom") {
      const sm = Number.parseInt(cycleStartMonthVal ?? "1")
      const em = Number.parseInt(cycleEndMonthVal ?? "12")
      return {
        startDate: `${year}-${String(sm).padStart(2, "0")}-01`,
        endDate: `${year}-${String(em).padStart(2, "0")}-${String(new Date(year, em, 0).getDate()).padStart(2, "0")}`,
      }
    }
    return { startDate: "", endDate: "" }
  }, [cycleTypeVal, cycleYearVal, cycleQuarterVal, cycleMonthVal, cycleStartMonthVal, cycleEndMonthVal])

  useMemo(() => {
    if (cycleTypeVal === "quarterly") {
      cycleForm.setValue("title", `${cycleQuarterVal} ${cycleYearVal}`)
    } else if (cycleTypeVal === "monthly") {
      const monthName = new Date(0, Number.parseInt(cycleMonthVal ?? "1") - 1).toLocaleString("default", { month: "long" })
      cycleForm.setValue("title", `${monthName} ${cycleYearVal}`)
    }
  }, [cycleTypeVal, cycleYearVal, cycleQuarterVal, cycleMonthVal, cycleForm])

  const createCycleMutation = api.okrCycle.create.useMutation({
    onSuccess: () => {
      utils.okrCycle.list.invalidate()
      utils.okrCycle.getActive.invalidate()
      setCycleFormOpen(false)
      cycleForm.reset()
    },
  })

  const handleCreateCycle = cycleForm.handleSubmit(() => {
    if (!organization) return
    createCycleMutation.mutate({
      title: cycleForm.getValues("title"),
      description: cycleForm.getValues("description") || null,
      cycleType: cycleForm.getValues("cycleType"),
      startDate: cycleDates.startDate,
      endDate: cycleDates.endDate,
      organizationId: organization.id,
    })
  })

  // Delete cycle
  const [deleteCycle, setDeleteCycle] = useState<string | null>(null)
  const deleteCycleMutation = api.okrCycle.delete.useMutation({
    onSuccess: () => {
      utils.okrCycle.list.invalidate()
      utils.okrCycle.getActive.invalidate()
      setDeleteCycle(null)
    },
  })

  // Edit cycle
  const [editCycle, setEditCycle] = useState<{
    id: string; title: string; description: string | null; startDate: string; endDate: string
  } | null>(null)
  const updateCycleMutation = api.okrCycle.update.useMutation({
    onSuccess: () => {
      utils.okrCycle.list.invalidate()
      utils.okrCycle.getActive.invalidate()
      setEditCycle(null)
    },
  })

  // Activate cycle
  const activateCycleMutation = api.okrCycle.update.useMutation({
    onSuccess: () => {
      utils.okrCycle.list.invalidate()
      utils.okrCycle.getActive.invalidate()
    },
  })

  const toggleLockMutation = api.okrCycle.update.useMutation({
    onSuccess: () => {
      utils.okrCycle.list.invalidate()
      utils.okrCycle.getActive.invalidate()
    },
  })

  const openCycleForm = useCallback(() => {
    cycleForm.reset()
    setCycleFormOpen(true)
  }, [cycleForm])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold">Cycles</h1>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="h-8 w-auto min-w-20 rounded-none text-xs">
              {selectedYear === "all" ? "All years" : selectedYear}
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all">All years</SelectItem>
              {years.map((yr) => (
                <SelectItem key={yr} value={yr}>{yr}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" variant="outline" onClick={openCycleForm}>
          <Plus className="mr-1 size-3.5" />
          New Cycle
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : cycles.length === 0 ? (
        <div className="border border-border p-8 text-center text-xs text-muted-foreground">
          No cycles yet. Create one to get started.
        </div>
      ) : (
        <div className="border border-border">
          <div className="divide-y divide-border">
            {(selectedYear === "all" ? cycles : cycles.filter((c) => c.startDate?.startsWith(selectedYear))).map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{c.title}</span>
                    <Badge variant={c.status === "active" ? "default" : "outline"} className="text-[10px]">
                      {c.status}
                    </Badge>
                    {c.locked && (
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:bg-amber-950/30">
                        <Lock className="size-2.5 mr-0.5" />
                        locked
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {formatCycleDate(c)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                    {c.status !== "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => activateCycleMutation.mutate({ id: c.id, status: "active" })}
                        className="text-xs"
                      >
                        Set active
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setEditCycle({ id: c.id, title: c.title, description: c.description, startDate: c.startDate, endDate: c.endDate })}
                    >
                      <PencilSimple className="size-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => toggleLockMutation.mutate({ id: c.id, locked: !c.locked })}
                      disabled={toggleLockMutation.isPending}
                      title={c.locked ? "Unlock cycle" : "Lock cycle"}
                    >
                      {c.locked ? <LockOpen className="size-3.5" /> : <Lock className="size-3.5" />}
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => setDeleteCycle(c.id)}
                    >
                      <Trash className="size-3.5" />
                    </Button>
                  </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Cycle Dialog */}
      <Dialog open={cycleFormOpen} onOpenChange={setCycleFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create cycle</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateCycle}>
            <div className="space-y-4">
              <Field>
                <FieldLabel>Title</FieldLabel>
                <Controller control={cycleForm.control} name="title" render={({ field }) => <Input {...field} placeholder="Q3 2026" />} />
                <FieldError>{cycleForm.formState.errors.title?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel>Description (optional)</FieldLabel>
                <Controller control={cycleForm.control} name="description" render={({ field }) => <Textarea {...field} rows={2} />} />
              </Field>
              <Field>
                <FieldLabel>Type</FieldLabel>
                <Controller control={cycleForm.control} name="cycleType" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-8 w-full rounded-none text-xs">{field.value}</SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Year</FieldLabel>
                  <Controller control={cycleForm.control} name="year" render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-8 w-full rounded-none text-xs">{field.value}</SelectTrigger>
                      <SelectContent position="popper">
                        {Array.from({ length: new Date().getFullYear() - 2020 + 2 }, (_, i) => String(2020 + i)).map((y) => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                </Field>
                {cycleTypeVal === "quarterly" && (
                  <Field>
                    <FieldLabel>Quarter</FieldLabel>
                    <Controller control={cycleForm.control} name="quarter" render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-8 w-full rounded-none text-xs">{field.value}</SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="Q1">Q1 (Jan-Mar)</SelectItem>
                          <SelectItem value="Q2">Q2 (Apr-Jun)</SelectItem>
                          <SelectItem value="Q3">Q3 (Jul-Sep)</SelectItem>
                          <SelectItem value="Q4">Q4 (Oct-Dec)</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                  </Field>
                )}
                {cycleTypeVal === "monthly" && (
                  <Field>
                    <FieldLabel>Month</FieldLabel>
                    <Controller control={cycleForm.control} name="month" render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-8 w-full rounded-none text-xs">
                          {field.value ? new Date(0, Number.parseInt(field.value) - 1).toLocaleString("default", { month: "long" }) : ""}
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )} />
                  </Field>
                )}
                {cycleTypeVal === "custom" && (
                  <>
                    <Field>
                      <FieldLabel>Start month</FieldLabel>
                      <Controller control={cycleForm.control} name="startMonth" render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-8 w-full rounded-none text-xs">
                            {field.value ? new Date(0, Number.parseInt(field.value) - 1).toLocaleString("default", { month: "long" }) : ""}
                          </SelectTrigger>
                          <SelectContent position="popper">
                            {months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )} />
                    </Field>
                    <Field>
                      <FieldLabel>End month</FieldLabel>
                      <Controller control={cycleForm.control} name="endMonth" render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-8 w-full rounded-none text-xs">
                            {field.value ? new Date(0, Number.parseInt(field.value) - 1).toLocaleString("default", { month: "long" }) : ""}
                          </SelectTrigger>
                          <SelectContent position="popper">
                            {months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )} />
                    </Field>
                  </>
                )}
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setCycleFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createCycleMutation.isPending}>
                {createCycleMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <EditCycleDialog
        open={!!editCycle}
        onOpenChange={(o) => !o && setEditCycle(null)}
        defaultValues={{
          title: editCycle?.title ?? "",
          description: editCycle?.description ?? null,
          startDate: editCycle?.startDate ?? "",
          endDate: editCycle?.endDate ?? "",
        }}
        onSubmit={(data) => {
          if (editCycle) {
            updateCycleMutation.mutate({ id: editCycle.id, ...data, description: data.description ?? null })
          }
        }}
        isPending={updateCycleMutation.isPending}
      />

      {/* Delete Cycle Confirmation */}
      <Dialog open={!!deleteCycle} onOpenChange={(o) => !o && setDeleteCycle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete cycle?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This will delete all objectives and KRs in this cycle. Cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCycle(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteCycleMutation.mutate({ id: deleteCycle! })} disabled={deleteCycleMutation.isPending}>
              {deleteCycleMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
