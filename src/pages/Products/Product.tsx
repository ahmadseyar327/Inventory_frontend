import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router"
import { AlertTriangle, Boxes, Layers, LayoutGrid, Loader2, Minus, PackageX, Package, Plus, Table2 } from "lucide-react"
import Sidebar from "../../components/Sidebar/Sidebar"
import { useToast } from "../../contexts/useToast"
import { clearAuthToken } from "../../services/api"
import { type ProductResponse, type UpdateProductDTO, type CreateProductDTO } from "../../types/product.types"
import { productService } from "./Product.service"
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Modal,
  PageHeader,
  PageShell,
  PageSkeleton,
  Pill,
  RowActions,
  SearchInput,
  Segmented,
  StatCard,
  btnGhost,
  btnPrimary,
  card,
  cx,
  inputBase,
  th,
  toneBar,
  type Tone,
} from "../../components/ui/ui"

type ViewMode = "table" | "gallery"

/** Stock at or below this number is flagged as "Low". */
const LOW_STOCK = 10

const PRODUCT_TYPES = [
  { id: 1, name: "Electronics" },
  { id: 2, name: "Clothing" },
  { id: 3, name: "Food & Beverages" },
  { id: 4, name: "Home & Garden" },
  { id: 5, name: "Sports & Outdoors" },
]

function emptyForm(): CreateProductDTO | UpdateProductDTO {
  return { name: "", currentStock: 0, productTypeId: 1 }
}

function stockMeta(stock: number): { label: string; tone: Tone } {
  if (stock <= 0) return { label: "Out of stock", tone: "rose" }
  if (stock <= LOW_STOCK) return { label: "Low stock", tone: "amber" }
  return { label: "In stock", tone: "emerald" }
}

function StockBar({ stock, max, tone }: { stock: number; max: number; tone: Tone }) {
  const pct = Math.max(stock > 0 ? 4 : 0, Math.min(100, (stock / max) * 100))
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div className={cx("h-full rounded-full transition-all duration-700", toneBar[tone])} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function ProductsPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("table")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<CreateProductDTO | UpdateProductDTO>(emptyForm())
  const [submitting, setSubmitting] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<ProductResponse | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function fetchProducts() {
      try {
        const data = await productService.getAllProducts()
        if (isMounted) setProducts(data)
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to load products"
          setError(message)
          showToast({ title: "Error", message, variant: "error" })
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void fetchProducts()
    return () => {
      isMounted = false
    }
  }, [showToast])

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await productService.deleteProduct(pendingDelete.id)
      setProducts((prev) => prev.filter((p) => p.id !== pendingDelete.id))
      showToast({ title: "Deleted", message: "The product was removed from your inventory.", variant: "success" })
      setPendingDelete(null)
    } catch (err: unknown) {
      showToast({ title: "Delete failed", message: err instanceof Error ? err.message : "Failed to delete product", variant: "error" })
    } finally {
      setDeleting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!(formData as any).name?.trim()) {
      showToast({ title: "Validation Error", message: "Product name is required", variant: "warning" })
      return
    }
    if ((formData as any).currentStock < 0) {
      showToast({ title: "Validation Error", message: "Stock cannot be negative", variant: "warning" })
      return
    }

    setSubmitting(true)
    try {
      if (isEditMode && editingId) {
        const updated = await productService.updateProduct(editingId, formData as UpdateProductDTO)
        setProducts((prev) => prev.map((p) => (p.id === editingId ? updated : p)))
        showToast({ title: "Updated", message: `${updated.name} was saved.`, variant: "success" })
      } else {
        const created = await productService.createProduct(formData as CreateProductDTO)
        setProducts((prev) => [created, ...prev])
        showToast({ title: "Created", message: `${created.name} was added to your inventory.`, variant: "success" })
      }
      closeModal()
    } catch (err: unknown) {
      showToast({ title: "Error", message: err instanceof Error ? err.message : "Operation failed", variant: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  function openAddModal() {
    setIsEditMode(false)
    setEditingId(null)
    setFormData(emptyForm())
    setIsModalOpen(true)
  }

  function openEditModal(product: ProductResponse) {
    setIsEditMode(true)
    setEditingId(product.id)
    setFormData({ name: product.name, currentStock: product.currentStock, productTypeId: product.productTypeId })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingId(null)
    setIsEditMode(false)
    setFormData(emptyForm())
  }

  function setStock(next: number) {
    setFormData({ ...formData, currentStock: Math.max(0, Number.isFinite(next) ? next : 0) })
  }

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(term) || p.productTypeName.toLowerCase().includes(term))
  }, [products, searchTerm])

  const maxStock = useMemo(() => Math.max(1, ...products.map((p) => p.currentStock)), [products])
  const totalUnits = products.reduce((sum, p) => sum + p.currentStock, 0)
  const lowCount = products.filter((p) => p.currentStock > 0 && p.currentStock <= LOW_STOCK).length
  const outCount = products.filter((p) => p.currentStock <= 0).length

  const handleLogout = () => {
    clearAuthToken()
    showToast({ title: "Signed out", message: "You have been securely signed out.", variant: "success" })
    navigate("/login", { replace: true })
  }

  if (loading) {
    return (
      <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
        <PageShell>
          <PageSkeleton stats={4} rows={6} />
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

  const noMatches = (
    <EmptyState
      title="No products match your search"
      description={`Nothing found for “${searchTerm}”. Try a different name or type.`}
      action={
        <button type="button" className={btnGhost} onClick={() => setSearchTerm("")}>
          Clear search
        </button>
      }
    />
  )

  const noProducts = (
    <EmptyState
      icon={<Package className="h-6 w-6" />}
      title="Your catalog is empty"
      description="Add your first product to start tracking stock levels."
      action={
        <button type="button" onClick={openAddModal} className={btnPrimary}>
          <Plus className="h-4 w-4" /> Add product
        </button>
      }
    />
  )

  const currentStock = Number((formData as any).currentStock) || 0

  return (
    <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
      <PageShell>
        <PageHeader
          crumbs={["Workspace", "Inventory", "Products"]}
          title="Products"
          subtitle="Your inventory catalog, with live stock levels at a glance."
          action={
            <button type="button" onClick={openAddModal} className={btnPrimary}>
              <Plus className="h-4 w-4" /> New product
            </button>
          }
        />

        <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard index={0} label="Products" value={products.length} tone="blue" icon={<Package className="h-5 w-5" />} hint="Items in your catalog" />
          <StatCard index={1} label="Units in stock" value={totalUnits} tone="violet" icon={<Boxes className="h-5 w-5" />} hint="Across all products" />
          <StatCard index={2} label="Low stock" value={lowCount} tone="amber" icon={<AlertTriangle className="h-5 w-5" />} hint={`${LOW_STOCK} units or fewer`} />
          <StatCard index={3} label="Out of stock" value={outCount} tone="rose" icon={<PackageX className="h-5 w-5" />} hint="Needs restocking" />
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Segmented<ViewMode>
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: "table", label: "Table", icon: <Table2 className="h-4 w-4" /> },
              { value: "gallery", label: "Gallery", icon: <LayoutGrid className="h-4 w-4" /> },
            ]}
          />
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search by name or type" className="w-full sm:w-72" />
        </div>

        {viewMode === "table" && (
          <div className={cx(card, "ui-rise overflow-hidden")} style={{ animationDelay: "200ms" }}>
            {products.length === 0 ? (
              noProducts
            ) : filtered.length === 0 ? (
              noMatches
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/30">
                    <tr>
                      <th className={th}>Product</th>
                      <th className={cx(th, "hidden sm:table-cell")}>Type</th>
                      <th className={th}>Stock</th>
                      <th className={cx(th, "hidden md:table-cell")}>Status</th>
                      <th className={cx(th, "text-right")}>
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {filtered.map((product, i) => {
                      const meta = stockMeta(product.currentStock)
                      return (
                        <tr
                          key={product.id}
                          className="ui-rise group transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-400/[0.06]"
                          style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-500/20 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20">
                                <Package className="h-5 w-5" />
                              </span>
                              <span className="font-semibold text-slate-900 dark:text-white">{product.name}</span>
                            </div>
                          </td>
                          <td className="hidden px-5 py-3.5 sm:table-cell">
                            <Pill tone="slate" dot={false}>
                              {product.productTypeName}
                            </Pill>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="w-36">
                              <p className="mb-1.5 text-sm font-medium tabular-nums text-slate-800 dark:text-slate-100">
                                {product.currentStock.toLocaleString()} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">units</span>
                              </p>
                              <StockBar stock={product.currentStock} max={maxStock} tone={meta.tone} />
                            </div>
                          </td>
                          <td className="hidden px-5 py-3.5 md:table-cell">
                            <Pill tone={meta.tone}>{meta.label}</Pill>
                          </td>
                          <td className="px-5 py-3.5">
                            <RowActions label={product.name} onEdit={() => openEditModal(product)} onDelete={() => setPendingDelete(product)} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {products.length > 0 && (
              <button
                type="button"
                onClick={openAddModal}
                className="flex w-full items-center gap-2 border-t border-slate-200/80 px-5 py-3 text-left text-sm font-medium text-slate-500 transition-colors hover:bg-blue-50/60 hover:text-blue-600 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-blue-400/[0.06] dark:hover:text-blue-300"
              >
                <Plus className="h-4 w-4" /> Add a product
              </button>
            )}
          </div>
        )}

        {viewMode === "gallery" &&
          (products.length === 0 ? (
            <div className={card}>{noProducts}</div>
          ) : filtered.length === 0 ? (
            <div className={card}>{noMatches}</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((product, i) => {
                const meta = stockMeta(product.currentStock)
                return (
                  <div
                    key={product.id}
                    className={cx(
                      card,
                      "ui-rise group relative p-5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_18px_40px_-20px_rgba(37,99,235,0.4)] dark:hover:border-blue-500/50",
                    )}
                    style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-500/20 transition-transform duration-300 group-hover:scale-110 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20">
                        <Package className="h-5 w-5" />
                      </span>
                      <RowActions label={product.name} onEdit={() => openEditModal(product)} onDelete={() => setPendingDelete(product)} />
                    </div>
                    <h3 className="truncate font-semibold text-slate-900 dark:text-white">{product.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{product.productTypeName}</p>
                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">In stock</p>
                        <p className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">{product.currentStock.toLocaleString()}</p>
                      </div>
                      <Pill tone={meta.tone}>{meta.label}</Pill>
                    </div>
                    <div className="mt-3">
                      <StockBar stock={product.currentStock} max={maxStock} tone={meta.tone} />
                    </div>
                  </div>
                )
              })}
              <button
                type="button"
                onClick={openAddModal}
                className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-5 text-slate-400 transition-all hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-600 dark:border-slate-700 dark:text-slate-500 dark:hover:border-blue-500/60 dark:hover:bg-blue-400/[0.06] dark:hover:text-blue-300"
              >
                <Plus className="h-6 w-6" />
                <span className="text-sm font-semibold">Add product</span>
              </button>
            </div>
          ))}

        <p className="mt-5 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <Layers className="h-3.5 w-3.5" />
          {filtered.length} product{filtered.length !== 1 ? "s" : ""} shown
        </p>

        <Modal
          open={isModalOpen}
          onClose={closeModal}
          title={isEditMode ? "Edit product" : "Add new product"}
          subtitle={isEditMode ? "Update the product details below." : "Fill in the details below."}
          icon={<Package className="h-5 w-5" />}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Product name" required htmlFor="p-name">
              <input id="p-name" type="text" autoFocus value={(formData as any).name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter product name" className={inputBase} />
            </Field>
            <Field label="Product type" htmlFor="p-type">
              <select id="p-type" value={(formData as any).productTypeId} onChange={(e) => setFormData({ ...formData, productTypeId: parseInt(e.target.value) })} className={inputBase}>
                {PRODUCT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Stock quantity" htmlFor="p-stock" hint={currentStock <= LOW_STOCK ? `Stock of ${LOW_STOCK} or fewer is flagged as low.` : undefined}>
              <div className="flex items-stretch gap-2">
                <button type="button" aria-label="Decrease stock" onClick={() => setStock(currentStock - 1)} className={cx(btnGhost, "px-3")}>
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  id="p-stock"
                  type="number"
                  min="0"
                  value={currentStock}
                  onChange={(e) => setStock(parseInt(e.target.value))}
                  className={cx(inputBase, "text-center tabular-nums")}
                />
                <button type="button" aria-label="Increase stock" onClick={() => setStock(currentStock + 1)} className={cx(btnGhost, "px-3")}>
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </Field>
            <div className="flex gap-3 border-t border-slate-200/80 pt-5 dark:border-slate-800">
              <button type="button" onClick={closeModal} className={cx(btnGhost, "flex-1")}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} className={cx(btnPrimary, "flex-1")}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? (isEditMode ? "Saving..." : "Creating...") : isEditMode ? "Save changes" : "Create product"}
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          open={pendingDelete !== null}
          title="Delete product?"
          message={
            <>
              <span className="font-semibold text-slate-900 dark:text-white">{pendingDelete?.name}</span> will be permanently removed from your inventory. This can’t be undone.
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