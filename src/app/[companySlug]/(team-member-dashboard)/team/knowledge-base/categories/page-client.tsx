"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Plus,
  PencilSimple,
  TrashSimple,
  CaretRight,
} from "@phosphor-icons/react"
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
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/trpc/client"

const categorySchema = z.object({ name: z.string().min(1).max(48) })
const subcategorySchema = z.object({ name: z.string().min(1).max(48) })
type CategoryForm = z.infer<typeof categorySchema>
type SubcategoryForm = z.infer<typeof subcategorySchema>

export default function TeamCategoriesPage() {
  const { organization } = useOrganization()
  const { data: session } = authClient.useSession()
  const activeTeamId = session?.session?.activeTeamId
  const utils = api.useUtils()

  const { data, isLoading } = api.knowledgeBase.categoryList.useQuery(
    { organizationId: organization?.id ?? "", teamId: activeTeamId ?? "" },
    { enabled: !!organization && !!activeTeamId },
  )

  const mutations = {
    catC: api.knowledgeBase.categoryCreate.useMutation({
      onSuccess: () => utils.knowledgeBase.categoryList.invalidate(),
    }),
    catU: api.knowledgeBase.categoryUpdate.useMutation({
      onSuccess: () => utils.knowledgeBase.categoryList.invalidate(),
    }),
    catD: api.knowledgeBase.categoryDelete.useMutation({
      onSuccess: () => utils.knowledgeBase.categoryList.invalidate(),
    }),
    subC: api.knowledgeBase.subcategoryCreate.useMutation({
      onSuccess: () => utils.knowledgeBase.categoryList.invalidate(),
    }),
    subU: api.knowledgeBase.subcategoryUpdate.useMutation({
      onSuccess: () => utils.knowledgeBase.categoryList.invalidate(),
    }),
    subD: api.knowledgeBase.subcategoryDelete.useMutation({
      onSuccess: () => utils.knowledgeBase.categoryList.invalidate(),
    }),
  }

  const [catD, setCatD] = useState<{
    open: boolean
    edit?: { id: string; name: string }
  }>({ open: false })
  const [subD, setSubD] = useState<{
    open: boolean
    categoryId: string
    edit?: { id: string; name: string }
  }>({ open: false, categoryId: "" })
  const [delT, setDelT] = useState<{
    type: "category" | "subcategory"
    id: string
    name: string
  } | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const cf = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "" },
  })
  const sf = useForm<SubcategoryForm>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: { name: "" },
  })

  function openCreateCat() {
    cf.reset()
    setCatD({ open: true })
  }
  function openEditCat(c: { id: string; name: string }) {
    cf.reset({ name: c.name })
    setCatD({ open: true, edit: c })
  }
  function openCreateSub(cid: string) {
    sf.reset()
    setSubD({ open: true, categoryId: cid })
  }
  function openEditSub(s: { id: string; name: string }, cid: string) {
    sf.reset({ name: s.name })
    setSubD({ open: true, categoryId: cid, edit: s })
  }

  async function hCat(d: CategoryForm) {
    if (!organization) return
    if (catD.edit) {
      await mutations.catU.mutateAsync({ id: catD.edit.id, name: d.name })
    } else {
      await mutations.catC.mutateAsync({
        organizationId: organization.id,
        name: d.name,
        teamId: activeTeamId ?? "",
      })
    }
    setCatD({ open: false })
  }
  async function hSub(d: SubcategoryForm) {
    if (subD.edit) {
      await mutations.subU.mutateAsync({ id: subD.edit.id, name: d.name })
    } else {
      await mutations.subC.mutateAsync({
        categoryId: subD.categoryId,
        name: d.name,
      })
    }
    setSubD({ open: false, categoryId: "" })
  }
  async function hDel() {
    if (!delT) return
    if (delT.type === "category") {
      await mutations.catD.mutateAsync({ id: delT.id })
    } else {
      await mutations.subD.mutateAsync({ id: delT.id })
    }
    setDelT(null)
  }
  function toggle(id: string) {
    setExpanded((p) => {
      const n = new Set(p)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  if (isLoading)
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Skeleton className="size-8 rounded-full" />
      </div>
    )
  const categories = data?.categories ?? []

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Team Categories</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage team knowledge base categories and subcategories
          </p>
        </div>
        <Button size="sm" onClick={openCreateCat}>
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
            const ex = expanded.has(cat.id)
            return (
              <div key={cat.id} className="rounded-none border border-border">
                <button
                  onClick={() => toggle(cat.id)}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-accent transition-colors"
                >
                  <CaretRight
                    className={`size-3.5 text-muted-foreground transition-transform ${ex ? "rotate-90" : ""}`}
                  />
                  <span className="text-sm font-medium flex-1">{cat.name}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {cat.subcategories.length} subcategories
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditCat(cat)
                    }}
                  >
                    <PencilSimple className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDelT({ type: "category", id: cat.id, name: cat.name })
                    }}
                  >
                    <TrashSimple className="size-3.5" />
                  </Button>
                </button>
                {ex && (
                  <div className="border-t border-border px-4 py-2">
                    {cat.subcategories.length === 0 ? (
                      <p className="py-2 text-xs text-muted-foreground">
                        No subcategories.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {cat.subcategories.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent/50 transition-colors"
                          >
                            <span className="text-xs flex-1">{sub.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6"
                              onClick={() => openEditSub(sub, cat.id)}
                            >
                              <PencilSimple className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 text-destructive hover:text-destructive"
                              onClick={() =>
                                setDelT({
                                  type: "subcategory",
                                  id: sub.id,
                                  name: sub.name,
                                })
                              }
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
                      onClick={() => openCreateSub(cat.id)}
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
      <Dialog open={catD.open} onOpenChange={(o) => setCatD({ open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {catD.edit ? "Edit Category" : "New Category"}
            </DialogTitle>
            <DialogDescription>
              {catD.edit
                ? "Rename this category."
                : 'Create a new category. An "Uncategorized" subcategory will be created automatically.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={cf.handleSubmit(hCat)}>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input {...cf.register("name")} maxLength={48} />
              {cf.formState.errors.name && (
                <FieldError>{cf.formState.errors.name.message}</FieldError>
              )}
            </Field>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCatD({ open: false })}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={mutations.catC.isPending || mutations.catU.isPending}
              >
                {catD.edit ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={subD.open}
        onOpenChange={(o) => setSubD({ open: o, categoryId: subD.categoryId })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {subD.edit ? "Edit Subcategory" : "New Subcategory"}
            </DialogTitle>
            <DialogDescription>
              {subD.edit
                ? "Rename this subcategory."
                : "Create a new subcategory under the selected category."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={sf.handleSubmit(hSub)}>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input {...sf.register("name")} maxLength={48} />
              {sf.formState.errors.name && (
                <FieldError>{sf.formState.errors.name.message}</FieldError>
              )}
            </Field>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSubD({ open: false, categoryId: "" })}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={mutations.subC.isPending || mutations.subU.isPending}
              >
                {subD.edit ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!delT}
        onOpenChange={(o) => {
          if (!o) setDelT(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {delT?.type === "category" ? "Category" : "Subcategory"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{delT?.name}</strong>?
              {delT?.type === "category"
                ? " All subcategories and items will be permanently deleted."
                : " All items will be permanently deleted."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDelT(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={hDel}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
