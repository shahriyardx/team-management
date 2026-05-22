"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, PencilSimple, TrashSimple, CaretRight } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useOrganization } from "@/lib/organization-context"
import { api } from "@/lib/trpc/client"

const categorySchema = z.object({ name: z.string().min(1).max(48) })
const subcategorySchema = z.object({ name: z.string().min(1).max(48) })

type CategoryForm = z.infer<typeof categorySchema>
type SubcategoryForm = z.infer<typeof subcategorySchema>

export default function CategoriesPage() {
  const { organization } = useOrganization()
  const utils = api.useUtils()

  const { data, isLoading } = api.knowledgeBase.categoryList.useQuery(
    { organizationId: organization?.id ?? "" },
    { enabled: !!organization },
  )

  const createCategory = api.knowledgeBase.categoryCreate.useMutation({
    onSuccess: () => utils.knowledgeBase.categoryList.invalidate(),
  })
  const updateCategory = api.knowledgeBase.categoryUpdate.useMutation({
    onSuccess: () => utils.knowledgeBase.categoryList.invalidate(),
  })
  const deleteCategory = api.knowledgeBase.categoryDelete.useMutation({
    onSuccess: () => utils.knowledgeBase.categoryList.invalidate(),
  })
  const createSubcategory = api.knowledgeBase.subcategoryCreate.useMutation({
    onSuccess: () => utils.knowledgeBase.categoryList.invalidate(),
  })
  const updateSubcategory = api.knowledgeBase.subcategoryUpdate.useMutation({
    onSuccess: () => utils.knowledgeBase.categoryList.invalidate(),
  })
  const deleteSubcategory = api.knowledgeBase.subcategoryDelete.useMutation({
    onSuccess: () => utils.knowledgeBase.categoryList.invalidate(),
  })

  // Dialog state
  const [catDialog, setCatDialog] = useState<{ open: boolean; edit?: { id: string; name: string } }>({ open: false })
  const [subDialog, setSubDialog] = useState<{ open: boolean; categoryId: string; edit?: { id: string; name: string } }>({ open: false, categoryId: "" })
  const [deleteTarget, setDeleteTarget] = useState<{ type: "category" | "subcategory"; id: string; name: string } | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const catForm = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "" },
  })
  const subForm = useForm<SubcategoryForm>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: { name: "" },
  })

  function openCreateCategory() {
    catForm.reset({ name: "" })
    setCatDialog({ open: true })
  }

  function openEditCategory(cat: { id: string; name: string }) {
    catForm.reset({ name: cat.name })
    setCatDialog({ open: true, edit: cat })
  }

  function openCreateSubcategory(categoryId: string) {
    subForm.reset({ name: "" })
    setSubDialog({ open: true, categoryId })
  }

  function openEditSubcategory(sub: { id: string; name: string }, categoryId: string) {
    subForm.reset({ name: sub.name })
    setSubDialog({ open: true, categoryId, edit: sub })
  }

  async function handleCategorySubmit(data: CategoryForm) {
    if (!organization) return
    if (catDialog.edit) {
      await updateCategory.mutateAsync({ id: catDialog.edit.id, name: data.name })
    } else {
      await createCategory.mutateAsync({ organizationId: organization.id, name: data.name })
    }
    setCatDialog({ open: false })
  }

  async function handleSubcategorySubmit(data: SubcategoryForm) {
    if (subDialog.edit) {
      await updateSubcategory.mutateAsync({ id: subDialog.edit.id, name: data.name })
    } else {
      await createSubcategory.mutateAsync({ categoryId: subDialog.categoryId, name: data.name })
    }
    setSubDialog({ open: false, categoryId: "" })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    if (deleteTarget.type === "category") {
      await deleteCategory.mutateAsync({ id: deleteTarget.id })
    } else {
      await deleteSubcategory.mutateAsync({ id: deleteTarget.id })
    }
    setDeleteTarget(null)
  }

  function toggleCategory(id: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Skeleton className="size-8 rounded-full" />
      </div>
    )
  }

  const categories = data?.categories ?? []

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Categories</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage knowledge base categories and subcategories</p>
        </div>
        <Button size="sm" onClick={openCreateCategory}>
          <Plus className="mr-1.5 size-3.5" />
          New Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-xs text-muted-foreground">No categories yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => {
            const isExpanded = expandedCategories.has(cat.id)
            return (
              <div key={cat.id} className="rounded-none border border-border">
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-accent transition-colors"
                >
                  <CaretRight
                    className={`size-3.5 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  />
                  <span className="text-sm font-medium flex-1">{cat.name}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{cat.subcategories.length} subcategories</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={(e) => { e.stopPropagation(); openEditCategory(cat) }}
                  >
                    <PencilSimple className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "category", id: cat.id, name: cat.name }) }}
                  >
                    <TrashSimple className="size-3.5" />
                  </Button>
                </button>
                {isExpanded && (
                  <div className="border-t border-border px-4 py-2">
                    {cat.subcategories.length === 0 ? (
                      <p className="py-2 text-xs text-muted-foreground">No subcategories.</p>
                    ) : (
                      <div className="space-y-1">
                        {cat.subcategories.map((sub) => (
                          <div key={sub.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent/50 transition-colors">
                            <span className="text-xs flex-1">{sub.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6"
                              onClick={() => openEditSubcategory(sub, cat.id)}
                            >
                              <PencilSimple className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget({ type: "subcategory", id: sub.id, name: sub.name })}
                            >
                              <TrashSimple className="size-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-7 text-xs"
                      onClick={() => openCreateSubcategory(cat.id)}
                    >
                      <Plus className="mr-1 size-3" />
                      Add Subcategory
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Category Dialog */}
      <Dialog open={catDialog.open} onOpenChange={(open) => setCatDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{catDialog.edit ? "Edit Category" : "New Category"}</DialogTitle>
            <DialogDescription>
              {catDialog.edit ? "Rename this category." : "Create a new category. An \"Uncategorized\" subcategory will be created automatically."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={catForm.handleSubmit(handleCategorySubmit)}>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input {...catForm.register("name")} maxLength={48} />
              {catForm.formState.errors.name && <FieldError>{catForm.formState.errors.name.message}</FieldError>}
            </Field>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setCatDialog({ open: false })}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createCategory.isPending || updateCategory.isPending}>
                {catDialog.edit ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Subcategory Dialog */}
      <Dialog open={subDialog.open} onOpenChange={(open) => setSubDialog({ open, categoryId: subDialog.categoryId })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{subDialog.edit ? "Edit Subcategory" : "New Subcategory"}</DialogTitle>
            <DialogDescription>
              {subDialog.edit ? "Rename this subcategory." : "Create a new subcategory under the selected category."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={subForm.handleSubmit(handleSubcategorySubmit)}>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input {...subForm.register("name")} maxLength={48} />
              {subForm.formState.errors.name && <FieldError>{subForm.formState.errors.name.message}</FieldError>}
            </Field>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setSubDialog({ open: false, categoryId: "" })}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createSubcategory.isPending || updateSubcategory.isPending}>
                {subDialog.edit ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.type === "category" ? "Category" : "Subcategory"}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
              {deleteTarget?.type === "category"
                ? " All subcategories and items within this category will be permanently deleted."
                : " All items within this subcategory will be permanently deleted."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" size="sm" variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
