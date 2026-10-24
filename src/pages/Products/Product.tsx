import { type ProductResponse, type UpdateProductDTO , type CreateProductDTO  } from "../../types/product.types"
import { productService} from "./Product.service"

import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router"
import Sidebar from "../../components/Sidebar/Sidebar"
import { useToast } from "../../contexts/useToast"
import { clearAuthToken } from "../../services/api"


// --- Inline SVG Icons (Zero Dependencies) ---
const Icons = {
  Table: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>,
  Grid: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  Plus: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>,
  Search: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  More: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>,
  Box: () => <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  Trash: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  X: () => <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Edit: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
}

type ViewMode = "table" | "gallery"

export default function ProductsPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  
  // Modal State (Used for both Add and Edit)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  const [formData, setFormData] = useState<CreateProductDTO | UpdateProductDTO>({ 
    name: "", 
    currentStock: 0, 
    productTypeId: 1 
  })
  const [submitting, setSubmitting] = useState(false)

  // Fetch Data
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
          showToast({ title: "Products could not be loaded", message, variant: "error" })
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void fetchProducts()
    return () => { isMounted = false }
  }, [showToast])

  // Handlers
  async function handleDelete(id: number) {
    if (!window.confirm("Delete this product?")) return
    try {
      await productService.deleteProduct(id)
      setProducts(prev => prev.filter(p => p.id !== id))
      showToast({ title: "Product deleted", message: "The product was removed from your inventory.", variant: "success" })
    } catch (err: unknown) {
      showToast({
        title: "Product could not be deleted",
        message: err instanceof Error ? err.message : "Failed to delete product",
        variant: "error",
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!(formData as any).name?.trim()) {
      showToast({ title: "Product name is required", variant: "warning" })
      return
    }
    if ((formData as any).currentStock < 0) {
      showToast({ title: "Stock cannot be negative", variant: "warning" })
      return
    }

    setSubmitting(true)
    try {
      if (isEditMode && editingId) {
        // Update Existing
        const updated = await productService.updateProduct(editingId, formData as UpdateProductDTO)
        setProducts(prev => prev.map(p => p.id === editingId ? updated : p))
        showToast({ title: "Product updated", message: `${updated.name} was saved.`, variant: "success" })
      } else {
        // Create New
        const created = await productService.createProduct(formData as CreateProductDTO)
        setProducts(prev => [created, ...prev])
        showToast({ title: "Product created", message: `${created.name} was added to your inventory.`, variant: "success" })
      }
      closeModal()
    } catch (err: unknown) {
      showToast({
        title: isEditMode ? "Product could not be updated" : "Product could not be created",
        message: err instanceof Error ? err.message : "Operation failed",
        variant: "error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  function openAddModal() {
    setIsEditMode(false)
    setEditingId(null)
    setFormData({ name: "", currentStock: 0, productTypeId: 1 })
    setIsModalOpen(true)
  }

  function openEditModal(product: ProductResponse) {
    setIsEditMode(true)
    setEditingId(product.id)
    setFormData({
      name: product.name,
      currentStock: product.currentStock,
      productTypeId: product.productTypeId
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingId(null)
    setIsEditMode(false)
    setFormData({ name: "", currentStock: 0, productTypeId: 1 })
  }

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.productTypeName.toLowerCase().includes(term)
    )
  }, [products, searchTerm])

  const handleLogout = () => {
    clearAuthToken()
    showToast({ title: "Signed out", message: "You have been securely signed out.", variant: "success" })
    navigate("/login", { replace: true })
  }

  if (loading) {
    return (
      <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
        <div className="max-w-5xl mx-auto px-8 py-12 space-y-8">
          <div className="h-10 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />)}
          </div>
        </div>
      </Sidebar>
    )
  }

  if (error) {
    return (
      <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Retry</button>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
      <div className="max-w-5xl mx-auto px-0 py-4">
        
        {/* Document Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
            <span>Workspace</span>
            <span>/</span>
            <span>Inventory</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-medium">Products</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Products</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">Manage your inventory catalog.</p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "table" 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Icons.Table /> Table
            </button>
            <button
              onClick={() => setViewMode("gallery")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "gallery" 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Icons.Grid /> Gallery
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Icons.Search /></span>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 rounded-lg border border-transparent bg-slate-100 dark:bg-slate-800 pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-slate-300 dark:focus:border-slate-600 transition-all"
              />
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 rounded-lg bg-slate-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              <Icons.Plus /> New
            </button>
          </div>
        </div>

        {/* Table View */}
        {viewMode === "table" && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[40%]">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[25%]">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[20%]">Stock</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[15%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400 italic">No products found. Click "New" to add one.</td></tr>
                ) : (
                  filtered.map((product) => (
                    <tr key={product.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            <Icons.Box />
                          </div>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {product.name}
                          </span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 ring-1 ring-inset ring-slate-500/10">
                          {product.productTypeName}
                        </span>
                      </td>

                      {/* Stock */}
                      <td className="px-6 py-3">
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {product.currentStock.toLocaleString()} units
                        </span>
                      </td>

                      {/* Actions - Always Visible */}
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                            title="Edit"
                          >
                            <Icons.Edit />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
                            title="Delete"
                          >
                            <Icons.Trash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Add Row Placeholder */}
            <button
              onClick={openAddModal}
              className="w-full py-3 text-left px-6 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors border-t border-slate-200 dark:border-slate-800"
            >
              + Add a product
            </button>
          </div>
        )}

        {/* Gallery View */}
        {viewMode === "gallery" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                    <Icons.Box />
                  </div>
                  {/* Actions - Always Visible in Gallery too */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                      title="Edit"
                    >
                      <Icons.Edit />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(product.id) }}
                      className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 transition-all"
                      title="Delete"
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1 truncate">{product.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{product.productTypeName}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Stock</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{product.currentStock.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add Card */}
            <button
              onClick={openAddModal}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-5 text-slate-400 dark:text-slate-500 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-500 dark:hover:text-blue-400 transition-all min-h-[160px]"
            >
              <Icons.Plus />
              <span className="mt-2 text-sm font-medium">Add Product</span>
            </button>
          </div>
        )}

        {/* Footer Meta */}
        <div className="mt-6 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <span>{filtered.length} product{filtered.length !== 1 ? "s" : ""}</span>
          <span>Last updated just now</span>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div 
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isEditMode ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {isEditMode ? "Update product details below" : "Fill in the details below"}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <Icons.X />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
              {/* Product Name */}
              <div>
                <label htmlFor="productName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="productName"
                  type="text"
                  value={(formData as any).name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  autoFocus
                />
              </div>

              {/* Stock Quantity */}
              <div>
                <label htmlFor="stockQuantity" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Stock Quantity
                </label>
                <input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  value={(formData as any).currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              {/* Product Type */}
              <div>
                <label htmlFor="productType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Product Type
                </label>
                <select
                  id="productType"
                  value={(formData as any).productTypeId}
                  onChange={(e) => setFormData({ ...formData, productTypeId: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value={1}>Electronics</option>
                  <option value={2}>Clothing</option>
                  <option value={3}>Food & Beverages</option>
                  <option value={4}>Home & Garden</option>
                  <option value={5}>Sports & Outdoors</option>
                </select>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-slate-900 dark:bg-white px-4 py-2.5 text-sm font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save Changes" : "Create Product")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Sidebar>
  )
}