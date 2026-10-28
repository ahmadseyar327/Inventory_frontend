import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router"
import { 
  ShoppingBag, 
  Calendar, 
  DollarSign, 
  Package, 
  Plus, 
  Trash2, 
  Users,
  Loader2 
} from "lucide-react"
import Sidebar from "../../components/Sidebar/Sidebar"
import { useToast } from "../../contexts/useToast"
import { clearAuthToken } from "../../services/api"
import { saleService } from "./Sale.service" // Adjust path as needed
import type { 
  SaleResponseDTO, 
  CreateSaleDTO, 
  UpdateSaleDTO, 
  CreateSaleItemDTO 
} from "../../types/sales.types" // Adjust path as needed
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
} from "../../components/ui/ui"
import { productService } from "../Products/Product.service"
import type { ProductResponse } from "../../types/product.types"
import { customerService } from "../Customers/Customer.service" // Adjust path as needed
import type { CustomerResponseDTO } from "../../types/customer.types"

type ViewMode = "table" | "gallery"

function emptyForm(): CreateSaleDTO {
  return {
    saleDate: new Date().toISOString().split("T")[0],
    customerId: 1,
    items: [{ productId: 1, quantity: 1, unitPrice: 0 }],
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function SalesPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  
  const [sales, setSales] = useState<SaleResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("table")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<CreateSaleDTO | UpdateSaleDTO>(emptyForm())
  const [submitting, setSubmitting] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<SaleResponseDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [products, setProducts] = useState<ProductResponse[]>([])
  const [customers, setCustomers] = useState<CustomerResponseDTO[]>([])

  // Consolidated Data Fetching
  useEffect(() => {
    let isMounted = true
    async function fetchData() {
      try {
        setLoading(true)
        const [salesData, productsData, customersData] = await Promise.all([
          saleService.getAll(),
          productService.getAllProducts(),
          customerService.getAllCustomers(),
        ])
        if (isMounted) {
          setSales(salesData)
          setProducts(productsData)
          setCustomers(customersData)
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to load data"
          setError(message)
          showToast({ title: "Error", message, variant: "error" })
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void fetchData()
    return () => { isMounted = false }
  }, [showToast])

  // Delete Handler
  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await saleService.delete(pendingDelete.id)
      setSales((prev) => prev.filter((s) => s.id !== pendingDelete.id))
      showToast({ title: "Deleted", message: "The sale record was removed successfully.", variant: "success" })
      setPendingDelete(null)
    } catch (err: unknown) {
      showToast({ title: "Delete failed", message: err instanceof Error ? err.message : "Failed to delete sale", variant: "error" })
    } finally {
      setDeleting(false)
    }
  }

  // Submit Handler (Create / Update)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (formData.items.length === 0) {
      showToast({ title: "Validation Error", message: "At least one item is required.", variant: "warning" })
      return
    }

    setSubmitting(true)
    try {
      if (isEditMode && editingId) {
        const updated = await saleService.update(editingId, formData as UpdateSaleDTO)
        setSales((prev) => prev.map((s) => (s.id === editingId ? updated : s)))
        showToast({ title: "Updated", message: `Sale #${editingId} was updated.`, variant: "success" })
      } else {
        const created = await saleService.create(formData as CreateSaleDTO)
        setSales((prev) => [created, ...prev])
        showToast({ title: "Created", message: "New sale recorded successfully.", variant: "success" })
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
    setFormData({
      saleDate: new Date().toISOString().split("T")[0],
      customerId: customers[0]?.id || 1,
      items: [{ productId: products[0]?.id || 1, quantity: 1, unitPrice: 0 }],
    })
    setIsModalOpen(true)
  }

  function openEditModal(sale: SaleResponseDTO) {
    setIsEditMode(true)
    setEditingId(sale.id)
    setFormData({
      saleDate: sale.saleDate.split("T")[0],
      customerId: sale.customerId,
      items: sale.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingId(null)
    setIsEditMode(false)
    setFormData(emptyForm())
  }

  // Dynamic Item Handlers
  function addItem() {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: products[0]?.id || 1, quantity: 1, unitPrice: 0 }],
    })
  }

  function removeItem(index: number) {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  function updateItem(index: number, field: keyof CreateSaleItemDTO, value: number) {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData({ ...formData, items: newItems })
  }

  const modalTotal = useMemo(() => {
    return formData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }, [formData.items])

  // Filtering & Stats
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return sales.filter(
      (s) => s.customerName.toLowerCase().includes(term) || s.id.toString().includes(term)
    )
  }, [sales, searchTerm])

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)
  const totalItemsSold = sales.reduce((sum, s) => sum + s.items.reduce((s, i) => s + i.quantity, 0), 0)
  const uniqueCustomers = new Set(sales.map((s) => s.customerId)).size

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
      title="No sales match your search"
      description={`Nothing found for “${searchTerm}”. Try a different customer name or ID.`}
      action={
        <button type="button" className={btnGhost} onClick={() => setSearchTerm("")}>
          Clear search
        </button>
      }
    />
  )

  const noSales = (
    <EmptyState
      icon={<ShoppingBag className="h-6 w-6" />}
      title="No sales recorded"
      description="Add your first sale to start tracking revenue and inventory outflow."
      action={
        <button type="button" onClick={openAddModal} className={btnPrimary}>
          <Plus className="h-4 w-4" /> Record Sale
        </button>
      }
    />
  )

  return (
    <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
      <PageShell>
        <PageHeader
          crumbs={["Workspace", "Sales", "Transactions"]}
          title="Sales"
          subtitle="Track outgoing inventory, customer orders, and revenue."
          action={
            <button type="button" onClick={openAddModal} className={btnPrimary}>
              <Plus className="h-4 w-4" /> New Sale
            </button>
          }
        />

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard index={0} label="Total Sales" value={sales.length} tone="emerald" icon={<ShoppingBag className="h-5 w-5" />} hint="Recorded transactions" />
          <StatCard index={1} label="Total Revenue" value={totalRevenue} tone="violet" icon={<DollarSign className="h-5 w-5" />} hint="Lifetime earnings" />
          <StatCard index={2} label="Total Items Sold" value={totalItemsSold} tone="blue" icon={<Package className="h-5 w-5" />} hint="Units shipped" />
          <StatCard index={3} label="Unique Customers" value={uniqueCustomers} tone="amber" icon={<Users className="h-5 w-5" />} hint="Served clients" />
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Segmented<ViewMode>
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: "table", label: "Table", icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg> },
              { value: "gallery", label: "Cards", icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> },
            ]}
          />
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search by customer or ID" className="w-full sm:w-72" />
        </div>

        {/* Table View */}
        {viewMode === "table" && (
          <div className={cx(card, "ui-rise overflow-hidden")} style={{ animationDelay: "200ms" }}>
            {sales.length === 0 ? (
              noSales
            ) : filtered.length === 0 ? (
              noMatches
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/30">
                    <tr>
                      <th className={th}>ID & Date</th>
                      <th className={th}>Customer</th>
                      <th className={cx(th, "hidden sm:table-cell")}>Items</th>
                      <th className={th}>Total</th>
                      <th className={cx(th, "text-right")}>
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {filtered.map((sale, i) => (
                      <tr
                        key={sale.id}
                        className="ui-rise group cursor-pointer transition-colors hover:bg-emerald-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 dark:hover:bg-emerald-400/[0.06]"
                        role="link"
                        tabIndex={0}
                        aria-label={`View sale ${sale.id} details`}
                        onClick={() => navigate(`/sale/${sale.id}`)}
                        onKeyDown={(event) => {
                          if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                            event.preventDefault()
                            navigate(`/sales/${sale.id}`)
                          }
                        }}
                        style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 dark:text-white">#{sale.id}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="h-3 w-3" /> {formatDate(sale.saleDate)}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Pill tone="slate" dot={false}>{sale.customerName}</Pill>
                        </td>
                        <td className="hidden px-5 py-3.5 sm:table-cell">
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {sale.items.length} types ({sale.items.reduce((s, item) => s + item.quantity, 0)} units)
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(sale.total)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                            <RowActions label={`Sale #${sale.id}`} onEdit={() => openEditModal(sale)} onDelete={() => setPendingDelete(sale)} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Gallery View */}
        {viewMode === "gallery" &&
          (sales.length === 0 ? (
            <div className={card}>{noSales}</div>
          ) : filtered.length === 0 ? (
            <div className={card}>{noMatches}</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((sale, i) => (
                <div
                  key={sale.id}
                  className={cx(
                    card,
                    "ui-rise group relative cursor-pointer p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_18px_40px_-20px_rgba(16,185,129,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:border-emerald-500/50",
                  )}
                  role="link"
                  tabIndex={0}
                  aria-label={`View sale ${sale.id} details`}
                  onClick={() => navigate(`/sale/${sale.id}`)}
                  onKeyDown={(event) => {
                    if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault()
                      navigate(`/sales/${sale.id}`)
                    }
                  }}
                  style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                      <RowActions label={`Sale #${sale.id}`} onEdit={() => openEditModal(sale)} onDelete={() => setPendingDelete(sale)} />
                    </div>
                  </div>
                  
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="truncate font-semibold text-slate-900 dark:text-white">#{sale.id}</h3>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(sale.total)}</span>
                  </div>
                  
                  <Pill tone="slate" dot={false}>{sale.customerName}</Pill>
                  
                  <div className="mt-4 space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                    {sale.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                        <span>{item.productName} <span className="text-slate-400">x{item.quantity}</span></span>
                        <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(sale.saleDate)}
                  </div>
                </div>
              ))}
            </div>
          ))}

        {/* Footer Meta */}
        <p className="mt-5 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
          {filtered.length} sale{filtered.length !== 1 ? "s" : ""} shown
        </p>

        {/* Create / Edit Modal */}
        <Modal
          open={isModalOpen}
          onClose={closeModal}
          title={isEditMode ? "Edit Sale" : "Record New Sale"}
          subtitle={isEditMode ? "Update the sale details and items below." : "Fill in the customer and item details below."}
          icon={<ShoppingBag className="h-5 w-5" />}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Sale Date" required htmlFor="s-date">
                <input 
                  id="s-date" 
                  type="date" 
                  required
                  value={formData.saleDate} 
                  onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })} 
                  className={inputBase} 
                />
              </Field>
              <Field label="Customer" required htmlFor="s-customer">
                <select 
                  id="s-customer" 
                  required
                  value={formData.customerId} 
                  onChange={(e) => setFormData({ ...formData, customerId: parseInt(e.target.value) })} 
                  className={inputBase}
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Sale Items" required>
              <div className="space-y-3">
                {formData.items.map((item, index) => {
                  const subtotal = item.quantity * item.unitPrice
                  return (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-end gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Product</label>
                        <select 
                          value={item.productId} 
                          onChange={(e) => updateItem(index, "productId", parseInt(e.target.value))}
                          className={cx(inputBase, "text-sm py-2")}
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Qty</label>
                        <input 
                          type="number" 
                          min="1" 
                          value={item.quantity} 
                          onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                          className={cx(inputBase, "text-sm py-2 text-center")}
                        />
                      </div>
                      <div className="w-28">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Unit Price</label>
                        <input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          value={item.unitPrice} 
                          onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                          className={cx(inputBase, "text-sm py-2 text-right")}
                        />
                      </div>
                      <div className="w-24 flex flex-col items-end">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Subtotal</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white py-2">{formatCurrency(subtotal)}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeItem(index)}
                        disabled={formData.items.length === 1}
                        className="mb-0.5 p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
                
                <button 
                  type="button" 
                  onClick={addItem} 
                  className={cx(btnGhost, "w-full border-dashed")}
                >
                  <Plus className="h-4 w-4" /> Add Another Item
                </button>
              </div>
            </Field>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-slate-800">
              <div className="text-sm">
                <span className="text-slate-500 dark:text-slate-400">Estimated Total: </span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(modalTotal)}</span>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={closeModal} className={cx(btnGhost)}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className={cx(btnPrimary, "min-w-[140px]")}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? (isEditMode ? "Saving..." : "Recording...") : isEditMode ? "Save Changes" : "Record Sale"}
                </button>
              </div>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={pendingDelete !== null}
          title="Delete sale record?"
          message={
            <>
              Sale <span className="font-semibold text-slate-900 dark:text-white">#{pendingDelete?.id}</span> to {pendingDelete?.customerName} will be permanently removed. This action cannot be undone.
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