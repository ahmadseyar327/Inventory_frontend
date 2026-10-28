import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router"
import { 
  ShoppingCart, 
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
import { purchaseService } from "./Purchase.service" // Adjust path as needed
import type { 
  PurchaseResponseDTO, 
  CreatePurchaseDTO, 
  UpdatePurchaseDTO, 
  CreatePurchaseItemDTO 
} from "../../types/purchase.types" // Adjust path as needed
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
  type Tone,
} from "../../components/ui/ui"
import { productService } from "../Products/Product.service"
import type { ProductResponse } from "../../types/product.types"
import type { SupplierResponseDTO } from "../../types/supplier.types"
import { supplierService } from "../Suppliers/Supplier.service"

type ViewMode = "table" | "gallery"

// --- MOCK DATA FOR DROPDOWNS (Replace with actual API calls if you have supplierService/productService) ---
const MOCK_SUPPLIERS = [
  { id: 1, name: "Acme Corp" },
  { id: 2, name: "Global Tech Supplies" },
  { id: 3, name: "Fresh Foods Distributors" },
]

const MOCK_PRODUCTS = [
  { id: 1, name: "Wireless Mouse" },
  { id: 2, name: "Mechanical Keyboard" },
  { id: 3, name: "Office Chair" },
  { id: 4, name: "Monitor 27-inch" },
]

function emptyForm(): CreatePurchaseDTO {
  return {
    purchaseDate: new Date().toISOString().split("T")[0],
    supplierId: MOCK_SUPPLIERS[0]?.id || 1,
    items: [{ productId: MOCK_PRODUCTS[0]?.id || 1, quantity: 1, unitPrice: 0 }],
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function PurchasesPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  
  const [purchases, setPurchases] = useState<PurchaseResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("table")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<CreatePurchaseDTO | UpdatePurchaseDTO>(emptyForm())
  const [submitting, setSubmitting] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<PurchaseResponseDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [suppliers , setSuppliers] = useState<SupplierResponseDTO[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function fetchProducts(){
    try{
        const data = await productService.getAllProducts()
        if(isMounted) setProducts(data);
    }catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to load products"
          setError(message)
          showToast({ title: "Error", message, variant: "error" })
        }
    }finally {
        if (isMounted) setLoading(false)
      }
  }void fetchProducts()
    return () => { isMounted = false }
  }, [showToast])


  useEffect(() => {
    let isMounted = true;
    async function fetchSuppliers(){
    try{
        const data = await supplierService.getAllSuppliers()
        if(isMounted) setSuppliers(data);
    }catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to load suppliers"
          setError(message)
          showToast({ title: "Error", message, variant: "error" })
        }
    }finally {
        if (isMounted) setLoading(false)
      }
  }void fetchSuppliers()
    return () => { isMounted = false }
  }, [showToast])
  

  // Fetch Purchases on Mount
  useEffect(() => {
    let isMounted = true
    async function fetchPurchases() {
      try {
        const data = await purchaseService.getAll()
        if (isMounted) setPurchases(data)
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to load purchases"
          setError(message)
          showToast({ title: "Error", message, variant: "error" })
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void fetchPurchases()
    return () => { isMounted = false }
  }, [showToast])

  // Delete Handler
  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await purchaseService.delete(pendingDelete.id)
      setPurchases((prev) => prev.filter((p) => p.id !== pendingDelete.id))
      showToast({ title: "Deleted", message: "The purchase record was removed successfully.", variant: "success" })
      setPendingDelete(null)
    } catch (err: unknown) {
      showToast({ title: "Delete failed", message: err instanceof Error ? err.message : "Failed to delete purchase", variant: "error" })
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
        const updated = await purchaseService.update(editingId, formData as UpdatePurchaseDTO)
        setPurchases((prev) => prev.map((p) => (p.id === editingId ? updated : p)))
        showToast({ title: "Updated", message: `Purchase #${editingId} was updated.`, variant: "success" })
      } else {
        const created = await purchaseService.create(formData as CreatePurchaseDTO)
        setPurchases((prev) => [created, ...prev])
        showToast({ title: "Created", message: "New purchase recorded successfully.", variant: "success" })
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

  function openEditModal(purchase: PurchaseResponseDTO) {
    setIsEditMode(true)
    setEditingId(purchase.id)
    setFormData({
      purchaseDate: purchase.purchaseDate.split("T")[0], // Ensure YYYY-MM-DD format for input
      supplierId: purchase.supplierId,
      items: purchase.items.map((i) => ({
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
      items: [...formData.items, { productId: MOCK_PRODUCTS[0]?.id || 1, quantity: 1, unitPrice: 0 }],
    })
  }

  function removeItem(index: number) {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  function updateItem(index: number, field: keyof CreatePurchaseItemDTO, value: number) {
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
    return purchases.filter(
      (p) => p.supplierName.toLowerCase().includes(term) || p.id.toString().includes(term)
    )
  }, [purchases, searchTerm])

  const totalSpent = purchases.reduce((sum, p) => sum + p.total, 0)
  const totalItems = purchases.reduce((sum, p) => sum + p.items.reduce((s, i) => s + i.quantity, 0), 0)
  const uniqueSuppliers = new Set(purchases.map((p) => p.supplierId)).size

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
      title="No purchases match your search"
      description={`Nothing found for “${searchTerm}”. Try a different supplier name or ID.`}
      action={
        <button type="button" className={btnGhost} onClick={() => setSearchTerm("")}>
          Clear search
        </button>
      }
    />
  )

  const noPurchases = (
    <EmptyState
      icon={<ShoppingCart className="h-6 w-6" />}
      title="No purchases recorded"
      description="Add your first purchase order to start tracking inventory inflow."
      action={
        <button type="button" onClick={openAddModal} className={btnPrimary}>
          <Plus className="h-4 w-4" /> Record Purchase
        </button>
      }
    />
  )

  return (
    <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
      <PageShell>
        <PageHeader
          crumbs={["Workspace", "Procurement", "Purchases"]}
          title="Purchases"
          subtitle="Track incoming inventory, supplier orders, and spending."
          action={
            <button type="button" onClick={openAddModal} className={btnPrimary}>
              <Plus className="h-4 w-4" /> New Purchase
            </button>
          }
        />

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard index={0} label="Total Purchases" value={purchases.length} tone="blue" icon={<ShoppingCart className="h-5 w-5" />} hint="Recorded orders" />
          <StatCard index={1} label="Total Spent" value={totalSpent} tone="violet" icon={<DollarSign className="h-5 w-5" />} hint="Lifetime expenditure" />
          <StatCard index={2} label="Total Items" value={totalItems} tone="emerald" icon={<Package className="h-5 w-5" />} hint="Units received" />
          <StatCard index={3} label="Active Suppliers" value={uniqueSuppliers} tone="amber" icon={<Users className="h-5 w-5" />} hint="Unique vendors" />
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
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search by supplier or ID" className="w-full sm:w-72" />
        </div>

        {/* Table View */}
        {viewMode === "table" && (
          <div className={cx(card, "ui-rise overflow-hidden")} style={{ animationDelay: "200ms" }}>
            {purchases.length === 0 ? (
              noPurchases
            ) : filtered.length === 0 ? (
              noMatches
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/30">
                    <tr>
                      <th className={th}>ID & Date</th>
                      <th className={th}>Supplier</th>
                      <th className={cx(th, "hidden sm:table-cell")}>Items</th>
                      <th className={th}>Total</th>
                      <th className={cx(th, "text-right")}>
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {filtered.map((purchase, i) => (
                      <tr
                        key={purchase.id}
                        className="ui-rise group cursor-pointer transition-colors hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:hover:bg-blue-400/[0.06]"
                        role="link"
                        tabIndex={0}
                        aria-label={`View purchase ${purchase.id} details`}
                        onClick={() => navigate(`/purchases/${purchase.id}`)}
                        onKeyDown={(event) => {
                          if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                            event.preventDefault()
                            navigate(`/purchases/${purchase.id}`)
                          }
                        }}
                        style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 dark:text-white">#{purchase.id}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="h-3 w-3" /> {formatDate(purchase.purchaseDate)}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Pill tone="slate" dot={false}>{purchase.supplierName}</Pill>
                        </td>
                        <td className="hidden px-5 py-3.5 sm:table-cell">
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {purchase.items.length} types ({purchase.items.reduce((s, i) => s + i.quantity, 0)} units)
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(purchase.total)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                            <RowActions label={`Purchase #${purchase.id}`} onEdit={() => openEditModal(purchase)} onDelete={() => setPendingDelete(purchase)} />
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
          (purchases.length === 0 ? (
            <div className={card}>{noPurchases}</div>
          ) : filtered.length === 0 ? (
            <div className={card}>{noMatches}</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((purchase, i) => (
                <div
                  key={purchase.id}
                  className={cx(
                    card,
                    "ui-rise group relative cursor-pointer p-5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_18px_40px_-20px_rgba(37,99,235,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:border-blue-500/50",
                  )}
                  role="link"
                  tabIndex={0}
                  aria-label={`View purchase ${purchase.id} details`}
                  onClick={() => navigate(`/purchases/${purchase.id}`)}
                  onKeyDown={(event) => {
                    if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault()
                      navigate(`/purchases/${purchase.id}`)
                    }
                  }}
                  style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-500/20 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                    <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                      <RowActions label={`Purchase #${purchase.id}`} onEdit={() => openEditModal(purchase)} onDelete={() => setPendingDelete(purchase)} />
                    </div>
                  </div>
                  
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="truncate font-semibold text-slate-900 dark:text-white">#{purchase.id}</h3>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(purchase.total)}</span>
                  </div>
                  
                  <Pill tone="slate" dot={false} >{purchase.supplierName}</Pill>
                  
                  <div className="mt-4 space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                    {purchase.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                        <span>{item.productName} <span className="text-slate-400">x{item.quantity}</span></span>
                        <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(purchase.purchaseDate)}
                  </div>
                </div>
              ))}
            </div>
          ))}

        {/* Footer Meta */}
        <p className="mt-5 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
          {filtered.length} purchase{filtered.length !== 1 ? "s" : ""} shown
        </p>

        {/* Create / Edit Modal */}
        <Modal
          open={isModalOpen}
          onClose={closeModal}
          title={isEditMode ? "Edit Purchase" : "Record New Purchase"}
          subtitle={isEditMode ? "Update the purchase details and items below." : "Fill in the supplier and item details below."}
          icon={<ShoppingCart className="h-5 w-5" />}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Purchase Date" required htmlFor="p-date">
                <input 
                  id="p-date" 
                  type="date" 
                  required
                  value={formData.purchaseDate} 
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })} 
                  className={inputBase} 
                />
              </Field>
              <Field label="Supplier" required htmlFor="p-supplier">
                <select 
                  id="p-supplier" 
                  required
                  value={formData.supplierId} 
                  onChange={(e) => setFormData({ ...formData, supplierId: parseInt(e.target.value) })} 
                  className={inputBase}
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Purchase Items" required>
              <div className="space-y-3">
                {formData.items.map((item, index) => {
                  const product = products.find(p => p.id === item.productId)
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
                  {submitting ? (isEditMode ? "Saving..." : "Recording...") : isEditMode ? "Save Changes" : "Record Purchase"}
                </button>
              </div>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={pendingDelete !== null}
          title="Delete purchase record?"
          message={
            <>
              Purchase <span className="font-semibold text-slate-900 dark:text-white">#{pendingDelete?.id}</span> from {pendingDelete?.supplierName} will be permanently removed. This action cannot be undone.
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