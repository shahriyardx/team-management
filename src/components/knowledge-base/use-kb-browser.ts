"use client"

import { useEffect, useRef, useState } from "react"
import { api } from "@/lib/trpc/client"

export function useKbBrowser({
  organizationId,
  teamId,
  enabled,
}: {
  organizationId: string
  teamId?: string
  enabled: boolean
}) {
  const { data: catData } = api.knowledgeBase.categoryList.useQuery(
    { organizationId, ...(teamId !== undefined ? { teamId } : {}) },
    { enabled },
  )
  const categories = catData?.categories ?? []
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("__all__")

  const showAll = selectedCategoryId === "__all__"

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    setCollapsedCategories(new Set(categories.map((c) => c.id)))
  }, [categories])

  function toggleCategory(id: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const [searchQuery, setSearchQuery] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [searchPage, setSearchPage] = useState(0)

  const PAGE = 20

  function onSearchChange(value: string) {
    setSearchQuery(value)
    setSearchPage(0)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(value.trim()), 250)
  }

  function clearSearch() {
    setSearchQuery("")
    setDebouncedQuery("")
    setSearchPage(0)
  }

  const searchSkip = searchPage * PAGE

  const { data: searchData, isLoading: searchLoading } = api.knowledgeBase.searchItems.useQuery(
    {
      organizationId,
      query: debouncedQuery,
      ...(teamId !== undefined ? { teamId } : {}),
      categoryId: selectedCategoryId === "__all__" ? undefined : selectedCategoryId,
      skip: searchSkip,
      take: PAGE,
    },
    { enabled: enabled && debouncedQuery.length > 0 },
  )

  const searchResults = searchData?.items ?? []
  const totalResults = searchData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE))

  return {
    categories,
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
  }
}
