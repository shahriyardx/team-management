"use client"

import { type ReactNode } from "react"
import { ObjectiveCard, type ObjectiveItem } from "@/components/okrs/objective-card"
import { KrRow, type KrRowItem } from "@/components/okrs/kr-row"

type ObjectiveWithKRs = ObjectiveItem & { keyResults: KrRowItem[] }

interface ObjectiveCardWithKRsProps {
  objective: ObjectiveWithKRs
  onAddKr?: (objectiveId: string) => void
  onDeleteObjective?: (id: string) => void
  onEditObjective?: (id: string, title: string) => void
  krRenderer?: (kr: KrRowItem) => ReactNode
}

export function ObjectiveCardWithKRs({
  objective,
  onAddKr,
  onDeleteObjective,
  onEditObjective,
  krRenderer,
}: ObjectiveCardWithKRsProps) {
  return (
    <ObjectiveCard
      objective={objective}
      onAddKr={onAddKr}
      onEdit={onEditObjective}
      onDelete={onDeleteObjective}
      krRenderer={krRenderer as any ?? ((kr) => <KrRow kr={kr as KrRowItem} />)}
      sortable={!krRenderer}
    />
  )
}
