"use client"

import { Checkbox } from "@/components/ui/checkbox"

export function KbCheckbox(props: Record<string, unknown>) {
  const { className, checked } = props as Record<string, string | undefined>

  if (!className?.includes("task-list-item-checkbox")) {
    return <input className={className} type="checkbox" />
  }

  return <Checkbox className={className} defaultChecked={checked === "checked"} disabled />
}
