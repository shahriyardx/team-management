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

interface CategoryItem {
  id: string
  name: string
  subcategories: SubcategoryItem[]
}

export function KbAllCategoriesView({
  categories,
  organizationId,
  teamId,
  collapsedCategories,
  toggleCategory,
  baseHref,
}: {
  categories: CategoryItem[]
  organizationId: string
  teamId?: string
  collapsedCategories: Set<string>
  toggleCategory: (id: string) => void
  baseHref: string
}) {
  return (
    <div className="space-y-3">
      {categories.map((cat) => {
        const isCollapsed = collapsedCategories.has(cat.id)
        return (
          <div key={cat.id} className="border border-border">
            <button
              onClick={() => toggleCategory(cat.id)}
              className="flex w-full items-center gap-2 px-4 py-3 text-left bg-muted hover:bg-accent/50 transition-colors"
            >
              <CaretDown
                className={`size-3.5 text-muted-foreground/60 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
              />
              <span className="text-sm font-medium">{cat.name}</span>
            </button>
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden border-t border-border"
                >
                  <div className="space-y-5 px-4 py-3">
                    {cat.subcategories.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No subcategories.</p>
                    ) : (
                      cat.subcategories.map((sub) => (
                        <LazySubcategorySection
                          key={sub.id}
                          subcategory={sub}
                          organizationId={organizationId}
                          teamId={teamId}
                          baseHref={baseHref}
                        />
                      ))
                    )}
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

function LazySubcategorySection({
  subcategory,
  organizationId,
  teamId,
  baseHref,
}: {
  subcategory: SubcategoryItem
  organizationId: string
  teamId?: string
  baseHref: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [take, setTake] = useState(PAGE)

  const { data, isLoading } = api.knowledgeBase.itemList.useQuery(
    {
      organizationId,
      ...(teamId !== undefined ? { teamId } : {}),
      subcategoryId: subcategory.id,
      skip: 0,
      take,
    },
    { enabled: expanded },
  )

  const items = (data?.items ?? []) as KbItem[]
  const total = data?.total ?? 0
  const hasMore = items.length < total

  return (
    <div>
      <button
        onClick={() => { setExpanded((v) => !v); if (!expanded) setTake(PAGE) }}
        className="flex items-center gap-1.5 text-left mb-2 group"
      >
        <CaretDown
          className={`size-2.5 text-muted-foreground/50 transition-transform ${!expanded ? "-rotate-90" : ""}`}
        />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
          {subcategory.name}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5">
              {isLoading && items.length === 0 ? (
                <span className="size-4 animate-spin rounded-full border-2 border-foreground border-t-transparent mx-auto block my-2" />
              ) : items.length === 0 ? (
                <p className="text-xs text-muted-foreground pl-3">No items.</p>
              ) : (
                <>
                  {items.map((item: KbItem) => (
                    <KbItemRow key={item.id} item={item} baseHref={baseHref} />
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
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
