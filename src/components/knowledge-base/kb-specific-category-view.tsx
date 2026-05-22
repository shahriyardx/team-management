"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CaretDown } from "@phosphor-icons/react"
import type { KbItem } from "@/components/knowledge-base/kb-item-row"

interface SubcategoryGroup {
  subcategoryId: string
  subcategoryName: string
  items: KbItem[]
}

interface TimelineGroup {
  categoryId: string
  categoryName: string
  subcategories: SubcategoryGroup[]
}

export function KbSpecificCategoryView({
  timelineGroups,
  ItemRow,
}: {
  timelineGroups: TimelineGroup[]
  ItemRow: React.FC<{ item: KbItem }>
}) {
  const subs = timelineGroups[0]?.subcategories ?? []
  const [collapsedSubs, setCollapsedSubs] = useState<Set<string>>(new Set())

  function toggleSub(id: string) {
    setCollapsedSubs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-3">
      {subs.map(({ subcategoryId, subcategoryName, items }) => {
        const subCollapsed = collapsedSubs.has(subcategoryId)
        return (
          <div key={subcategoryId} className="border border-border">
            <button
              onClick={() => toggleSub(subcategoryId)}
              className="flex w-full items-center gap-2 px-4 py-3 text-left bg-muted hover:bg-accent/50 transition-colors"
            >
              <CaretDown
                className={`size-3.5 text-muted-foreground/60 transition-transform ${subCollapsed ? "-rotate-90" : ""}`}
              />
              <span className="text-sm font-medium">{subcategoryName}</span>
            </button>
            <AnimatePresence initial={false}>
              {!subCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden border-t border-border"
                >
                  <div className="space-y-1.5 px-4 py-3">
                    {items.map((item: KbItem) => (
                      <ItemRow key={item.id} item={item} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
