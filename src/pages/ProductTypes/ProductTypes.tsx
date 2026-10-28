import { useState, useEffect, useMemo } from "react"
import { Link, useNavigate } from "react-router"
import { ArrowLeft, Loader2, Plus, Tag, Tags } from "lucide-react"
import Sidebar from "../../components/Sidebar/Sidebar"
import { useToast } from "../../contexts/useToast"
import { clearAuthToken } from "../../services/api"
import type { ProductTypeResponse } from "../../types/productType.types"
import { productTypeService } from "./ProductTypes.service"
import {
  Avatar,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Modal,
  PageHeader,
  PageShell,
  PageSkeleton,
  RowActions,
  SearchInput,
  btnGhost,
  btnPrimary,
  card,
  cx,
  inputBase,
  th,
} from "../../components/ui/ui"

export default function ProductTypesPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [types, setTypes] = useState<ProductTypeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingType, setEditingType] = useState<ProductTypeResponse | null>(null)
  const [name, setName] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<ProductTypeResponse | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function fetchTypes() {
      try {
        const data = await productTypeService.getAll()
        if (isMounted) setTypes(data)
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to load product types"
          setError(message)
          showToast({ title: "Error", message, variant: "error" })
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void fetchTypes()
    return () => {
      isMounted = false
    }
  }, [showToast])

  function openAddModal() {
    setEditingType(null)
    setName("")
    setIsModalOpen(true)
  }

  function openEditModal(type: ProductTypeResponse) {
    setEditingType(type)
    setName(type.name)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingType(null)
    setName("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      showToast({ title: "Validation Error", message: "Type name is required", variant: "warning" })
      return
    }
    const duplicate = types.some((t) => t.id !== editingType?.id && t.name.toLowerCase() === trimmed.toLowerCase())
    if (duplicate) {
      showToast({ title: "Already exists", message: `A product type named “${trimmed}” already exists.`, variant: "warning" })
      return
    }

    setSubmitting(true)
    try {
      if (editingType) {
        const updated = await productTypeService.update(editingType.id, { name: trimmed })
        setTypes((prev) => prev.map((t) => (t.id === editingType.id ? updated : t)))
        showToast({ title: "Updated", message: `${updated.name} was saved.`, variant: "success" })
      } else {
        const created = await productTypeService.create({ name: trimmed })
        setTypes((prev) => [created, ...prev])
        showToast({ title: "Created", message: `${created.name} was added.`, variant: "success" })
      }
      closeModal()
    } catch (err: unknown) {
      showToast({ title: "Error", message: err instanceof Error ? err.message : "Operation failed", variant: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await productTypeService.delete(pendingDelete.id)
      setTypes((prev) => prev.filter((t) => t.id !== pendingDelete.id))
      showToast({ title: "Deleted", message: "The product type was removed.", variant: "success" })
      setPendingDelete(null)
    } catch (err: unknown) {
      showToast({ title: "Delete failed", message: err instanceof Error ? err.message : "Failed to delete product type", variant: "error" })
    } finally {
      setDeleting(false)
    }
  }

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return types.filter((t) => t.name.toLowerCase().includes(term))
  }, [types, searchTerm])

  const handleLogout = () => {
    clearAuthToken()
    showToast({ title: "Signed out", message: "You have been securely signed out.", variant: "success" })
    navigate("/login", { replace: true })
  }

  if (loading) {
    return (
      <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
        <PageShell>
          <PageSkeleton stats={0} rows={5} />
        </PageShell>
      </Sidebar>
    )
  }

  if (error) {
    return (
      <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
        <ErrorState message={error} />
      </Sidebar>
    )
  }

  return (
    <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
      <PageShell>
        <Link
          to="/settings"
          className="mb-5 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-slate-500 transition-colors hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to settings
        </Link>

        <PageHeader
          crumbs={["Workspace", "Settings", "Product types"]}
          title="Product types"
          subtitle="The types your products are grouped into. Use them to keep your catalog tidy."
          action={
            <button type="button" onClick={openAddModal} className={btnPrimary}>
              <Plus className="h-4 w-4" /> New type
            </button>
          }
        />

        {types.length > 0 && (
          <div className="mb-4">
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search product types" className="w-full sm:w-80" />
          </div>
        )}

        <div className={cx(card, "ui-rise overflow-hidden")} style={{ animationDelay: "120ms" }}>
          {types.length === 0 ? (
            <EmptyState
              icon={<Tags className="h-6 w-6" />}
              title="No product types yet"
              description="Create your first type, like Electronics or Clothing, to start grouping your products."
              action={
                <button type="button" onClick={openAddModal} className={btnPrimary}>
                  <Plus className="h-4 w-4" /> Add product type
                </button>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No product types match your search"
              description={`Nothing found for “${searchTerm}”.`}
              action={
                <button type="button" className={btnGhost} onClick={() => setSearchTerm("")}>
                  Clear search
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/30">
                  <tr>
                    <th className={th}>Type</th>
                    <th className={cx(th, "hidden sm:table-cell")}>ID</th>
                    <th className={cx(th, "text-right")}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {filtered.map((type, i) => (
                    <tr
                      key={type.id}
                      className="ui-rise group transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-400/[0.06]"
                      style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={type.name} icon={<Tag className="h-5 w-5" />} />
                          <span className="font-semibold text-slate-900 dark:text-white">{type.name}</span>
                        </div>
                      </td>
                      <td className="hidden px-5 py-3.5 text-sm tabular-nums text-slate-500 dark:text-slate-400 sm:table-cell">#{type.id}</td>
                      <td className="px-5 py-3.5">
                        <RowActions label={type.name} onEdit={() => openEditModal(type)} onDelete={() => setPendingDelete(type)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {types.length > 0 && (
            <div className="border-t border-slate-200/80 bg-slate-50/60 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/30">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span> of{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-200">{types.length}</span> product types
              </p>
            </div>
          )}
        </div>

        <Modal
          open={isModalOpen}
          onClose={closeModal}
          title={editingType ? "Edit product type" : "Add product type"}
          subtitle={editingType ? "Rename this product type." : "Give your new product type a name."}
          icon={<Tag className="h-5 w-5" />}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Type name" required htmlFor="pt-name">
              <input id="pt-name" type="text" required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Electronics" className={inputBase} />
            </Field>
            <div className="flex gap-3 border-t border-slate-200/80 pt-5 dark:border-slate-800">
              <button type="button" onClick={closeModal} className={cx(btnGhost, "flex-1")}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} className={cx(btnPrimary, "flex-1")}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? (editingType ? "Saving..." : "Creating...") : editingType ? "Save changes" : "Create type"}
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          open={pendingDelete !== null}
          title="Delete product type?"
          message={
            <>
              <span className="font-semibold text-slate-900 dark:text-white">{pendingDelete?.name}</span> will be removed. Products that use this type may be affected, so check them first.
            </>
          }
          busy={deleting}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setPendingDelete(null)}
        />
      </PageShell>
    </Sidebar>
  )
}