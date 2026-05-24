"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CaretDown } from "@phosphor-icons/react"
import { api } from "@/lib/trpc/client"
import { KbItemRow, type KbItem } from "@/components/knowledge-base/kb-item-row"

const PAGE = 20

interface SubcategoryItem {
  id: string
  name: string
}

export function KbSpecificCategoryView({
  subcategories,
  organizationId,
  teamId,
  baseHref,
  onItemSelect,
}: {
  subcategories: SubcategoryItem[]
  organizationId: string
  teamId?: string
  baseHref: string
  onItemSelect?: (id: string) => void
}) {
  const [collapsedSubs, setCollapsedSubs] = useState<Set<string>>(() => new Set(subcategories.map((s) => s.id)))

  return (
    <div className="space-y-3">
      {subcategories.map((sub) => (
        <div key={sub.id} className="border border-border">
          <button
            onClick={() => setCollapsedSubs((prev) => { const n = new Set(prev); if (n.has(sub.id)) n.delete(sub.id); else n.add(sub.id); return n })}
            className="flex w-full items-center gap-2 px-4 py-3 text-left bg-muted hover:bg-accent/50 transition-colors"
          >
            <CaretDown className={`size-3.5 text-muted-foreground/60 transition-transform ${collapsedSubs.has(sub.id) ? "-rotate-90" : ""}`} />
            <span className="text-sm font-medium">{sub.name}</span>
          </button>
          <AnimatePresence initial={false}>
            {!collapsedSubs.has(sub.id) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden border-t border-border"
              >
                <div className="space-y-1.5 px-4 py-3">
                  <LazySubcategoryItems subcategoryId={sub.id} organizationId={organizationId} teamId={teamId} baseHref={baseHref} onItemSelect={onItemSelect} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

function LazySubcategoryItems({
  subcategoryId,
  organizationId,
  teamId,
  baseHref,
  onItemSelect,
}: {
  subcategoryId: string
  organizationId: string
  teamId?: string
  baseHref: string
  onItemSelect?: (id: string) => void
}) {
  const [take, setTake] = useState(PAGE)

  const { data, isLoading } = api.knowledgeBase.itemList.useQuery(
    {
      organizationId,
      ...(teamId !== undefined ? { teamId } : {}),
      subcategoryId,
      skip: 0,
      take,
    },
    { enabled: true },
  )

  const items = (data?.items ?? []) as KbItem[]
  const total = data?.total ?? 0
  const hasMore = items.length < total

  if (isLoading && items.length === 0) {
    return <span className="size-4 animate-spin rounded-full border-2 border-foreground border-t-transparent mx-auto block my-4" />
  }

  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">No items in this subcategory.</p>
  }

  return (
    <>
      {items.map((item: KbItem) => (
        <KbItemRow key={item.id} item={item} baseHref={baseHref} onSelect={onItemSelect} />
      ))}
      {hasMore ? (
        <button
          onClick={() => setTake((t) => t + PAGE)}
          disabled={isLoading}
          className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors border border-dashed border-border mt-1"
        >
          {isLoading ? "Loading..." : "Load more"}
        </button>
      ) : items.length > PAGE ? (
        <p className="text-[10px] text-muted-foreground/50 text-center pt-1">All {total} items loaded.</p>
      ) : null}
    </>
  )
}
