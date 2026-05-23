"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { PlusIcon } from "@phosphor-icons/react"
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
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/trpc/client"
import { KbItemRow, type KbItem } from "@/components/knowledge-base/kb-item-row"
import { KbAllCategoriesView } from "@/components/knowledge-base/kb-all-categories-view"
import { KbSpecificCategoryView } from "@/components/knowledge-base/kb-specific-category-view"

export default function TeamKnowledgeBasePage() {
  const { companySlug } = useParams<{ companySlug: string }>()
  const { organization } = useOrganization()
  const { loading: roleLoading } = useMemberRole()
  const { data: session } = authClient.useSession()
  const activeTeamId = session?.session?.activeTeamId

  const { data: catData } = api.knowledgeBase.categoryList.useQuery(
    { organizationId: organization?.id ?? "", teamId: activeTeamId ?? "" },
    { enabled: !!organization && !!activeTeamId },
  )
  const categories = catData?.categories ?? []
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("__all__")
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  function toggleCategory(id: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const { data: itemsData, isLoading } = api.knowledgeBase.itemList.useQuery(
    { organizationId: organization?.id ?? "", categoryId: selectedCategoryId === "__all__" ? undefined : selectedCategoryId, teamId: activeTeamId ?? "", take: 100 },
    { enabled: !!organization && !!activeTeamId },
  )
  const items = (itemsData?.items ?? []) as KbItem[]

  const timelineGroups = useMemo(() => {
    if (!catData) return []
    const result: Array<{ categoryId: string; categoryName: string; subcategories: Array<{ subcategoryId: string; subcategoryName: string; items: KbItem[] }> }> = []
    for (const cat of categories) {
      const subEntries: Array<{ subcategoryId: string; subcategoryName: string; items: KbItem[] }> = []
      for (const sub of cat.subcategories) {
        const subItems = items.filter((i) => i.subcategory.id === sub.id)
        if (subItems.length > 0) subEntries.push({ subcategoryId: sub.id, subcategoryName: sub.name, items: subItems })
      }
      if (subEntries.length > 0) result.push({ categoryId: cat.id, categoryName: cat.name, subcategories: subEntries })
    }
    return result
  }, [items, categories, catData])

  const showAll = selectedCategoryId === "__all__"

  function ItemRow({ item }: { item: KbItem }) {
    return <KbItemRow item={item} baseHref={`/${companySlug}/manage-team/knowledge-base`} />
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold">Team Knowledge</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Knowledge shared within your team.</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Categories</SelectItem>
              {categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Link href="add"><Button><PlusIcon className="mr-1.5 size-3.5" />Add Knowledge</Button></Link>
        </div>
      </div>

      {roleLoading ? (
        <div className="flex items-center justify-center py-20"><Skeleton className="size-8 rounded-full" /></div>
      ) : !activeTeamId ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20"><p className="text-xs text-muted-foreground">No active team selected.</p></div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20"><Skeleton className="size-8 rounded-full" /></div>
      ) : timelineGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20"><p className="text-xs text-muted-foreground">No knowledge items found for this team.</p></div>
      ) : showAll ? (
        <KbAllCategoriesView timelineGroups={timelineGroups} collapsedCategories={collapsedCategories} toggleCategory={toggleCategory} ItemRow={ItemRow} />
      ) : (
        <KbSpecificCategoryView timelineGroups={timelineGroups} ItemRow={ItemRow} />
      )}
    </div>
  )
}
