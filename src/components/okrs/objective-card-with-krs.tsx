"use client"

import { ObjectiveCard, type ObjectiveItem } from "@/components/okrs/objective-card"
import { KrRow, type KrRowItem } from "@/components/okrs/kr-row"

type ObjectiveWithKRs = ObjectiveItem & { keyResults: KrRowItem[] }

interface ObjectiveCardWithKRsProps {
  objective: ObjectiveWithKRs
  onAddKr?: (objectiveId: string) => void
  onDeleteObjective?: (id: string) => void
  onEditObjective?: (id: string, title: string) => void
}

export function ObjectiveCardWithKRs({
  objective,
  onAddKr,
  onDeleteObjective,
  onEditObjective,
}: ObjectiveCardWithKRsProps) {
  return (
    <ObjectiveCard
      objective={objective}
      onAddKr={onAddKr}
      onEdit={onEditObjective}
      onDelete={onDeleteObjective}
      krRenderer={(kr) => <KrRow kr={kr as KrRowItem} />}
    />
  )
}
