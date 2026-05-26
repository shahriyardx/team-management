"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, usePathname, useRouter } from "next/navigation"
import { MagnifyingGlassIcon, PlusIcon, X } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useOrganization } from "@/lib/organization-context"
import { useMemberRole } from "@/lib/use-member-role"
import { useKbBrowser } from "@/components/knowledge-base/use-kb-browser"
import { KbAllCategoriesView } from "@/components/knowledge-base/kb-all-categories-view"
import { KbItemRow, type KbItem } from "@/components/knowledge-base/kb-item-row"
import { KbSpecificCategoryView } from "@/components/knowledge-base/kb-specific-category-view"
import { KbDetailOverlay } from "@/components/knowledge-base/kb-detail-overlay"

export default function KnowledgeTimelinePage() {
  const { companySlug } = useParams<{ companySlug: string }>()
  const { organization } = useOrganization()
  const { role, loading: roleLoading } = useMemberRole()
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Sync selected item with URL search param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const item = params.get("item")
    if (item) setSelectedSlug(item)
  }, [])

  const handleSelect = (slug: string) => {
    setSelectedSlug(slug)
    router.replace(`?item=${slug}`, { scroll: false })
  }

  const handleClose = () => {
    setSelectedSlug(null)
    router.replace(pathname, { scroll: false })
  }

  const {
    categories,
    isCategoryLoading,
    selectedCategoryId,
    setSelectedCategoryId,
    showAll,
    collapsedCategories,
    toggleCategory,
    searchQuery,
    onSearchChange,
    clearSearch,
    searchPage,
    setSearchPage,
    searchLoading,
    searchResults,
    totalResults,
    totalPages,
    PAGE,
  } = useKbBrowser({
    organizationId: organization?.id ?? "",
    enabled: !!organization,
  })

  const selectedCat = categories.find((c) => c.id === selectedCategoryId)
  const baseHref = `/${companySlug}/knowledge-base`

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Knowledge Base</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Browse knowledge across your organization.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-auto">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 w-full rounded-none border border-input bg-transparent pl-8 pr-8 text-xs outline-hidden focus:border-ring focus:ring-1 focus:ring-ring/50"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Select
              value={selectedCategoryId}
              onValueChange={setSelectedCategoryId}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Link href={`${baseHref}/add`}>
              <Button>
                <PlusIcon className="mr-1.5 size-3.5" />
                Add Knowledge
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {roleLoading ? (
        <div className="flex items-center justify-center py-20">
          <Skeleton className="size-8 rounded-full" />
        </div>
      ) : role !== "owner" && role !== "admin" ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <p className="text-xs text-muted-foreground">
            You don't have access to org-wide knowledge.
          </p>
        </div>
      ) : searchQuery ? (
        searchLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
          </div>
        ) : searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <p className="text-xs text-muted-foreground">No results found.</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="mb-3 text-xs text-muted-foreground">
              {totalResults} result{totalResults !== 1 ? "s" : ""}
            </p>
            {searchResults.map((item: KbItem) => (
              <KbItemRow
                key={item.id}
                item={item}
                baseHref={baseHref}
                onSelect={handleSelect}
              />
            ))}
            {totalResults > PAGE && (
              <div className="flex items-center justify-between pt-3">
                <span className="text-xs text-muted-foreground">
                  Page {searchPage + 1} of {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={searchPage === 0}
                    onClick={() => setSearchPage((p) => p - 1)}
                    className="h-7 rounded-none border border-border px-3 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={searchPage >= totalPages - 1}
                    onClick={() => setSearchPage((p) => p + 1)}
                    className="h-7 rounded-none border border-border px-3 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      ) : isCategoryLoading ? (
        <div className="flex items-center justify-center py-20">
          <span className="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 border border-border p-6">
          <p className="text-xs text-muted-foreground">
            No knowledge base yet.
          </p>
        </div>
      ) : showAll ? (
        <KbAllCategoriesView
          categories={categories}
          organizationId={organization?.id ?? ""}
          collapsedCategories={collapsedCategories}
          toggleCategory={toggleCategory}
          baseHref={baseHref}
          onItemSelect={handleSelect}
        />
      ) : selectedCat ? (
        <KbSpecificCategoryView
          subcategories={selectedCat.subcategories}
          organizationId={organization?.id ?? ""}
          baseHref={baseHref}
          onItemSelect={handleSelect}
        />
      ) : null}

      {selectedSlug && (
        <KbDetailOverlay slug={selectedSlug} onClose={handleClose} />
      )}
    </div>
  )
}
