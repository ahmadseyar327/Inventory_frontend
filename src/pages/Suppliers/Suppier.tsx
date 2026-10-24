import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router"
import { useToast } from "../../contexts/useToast"
import Sidebar from "../../components/Sidebar/Sidebar"
import { type SupplierResponseDTO, type CreateSupplierDTO, type UpdateSupplierDTO } from "../../types/supplier.types"
import { supplierService } from "./Supplier.service"
import { clearAuthToken } from "../../services/api"

// --- Inline SVG Icons (Zero Dependencies) ---
const Icons = {
  Search: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Plus: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>,
  X: () => <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Trash: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Mail: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Phone: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  MapPin: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Truck: () => <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>, // Using arrows as generic supply icon or similar
  Edit: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
}

export default function SuppliersPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [suppliers, setSuppliers] = useState<SupplierResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  const [formData, setFormData] = useState<CreateSupplierDTO | UpdateSupplierDTO>({
    name: "", phone: null, email: null, address: null
  })
  const [submitting, setSubmitting] = useState(false)

  // Fetch Data
  useEffect(() => {
    let isMounted = true
    async function fetchSuppliers() {
      try {
        const data = await supplierService.getAllSuppliers()
        if (isMounted) setSuppliers(data)
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to load suppliers"
          setError(message)
          showToast({ title: "Suppliers could not be loaded", message, variant: "error" })
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void fetchSuppliers()
    return () => { isMounted = false }
  }, [showToast])

  // Handlers
  async function handleDelete(id: number) {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return

    try {
      await supplierService.deleteSupplier(id)
      setSuppliers(prev => prev.filter(s => s.id !== id))
      showToast({
        title: "Supplier deleted",
        message: "The supplier record was removed successfully.",
        variant: "success",
      })
    } catch (err: unknown) {
      showToast({
        title: "Delete failed",
        message: err instanceof Error ? err.message : "Failed to delete supplier",
        variant: "error",
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!(formData as any).name?.trim()) {
      showToast({ title: "Name is required", variant: "warning" })
      return
    }

    setSubmitting(true)
    try {
      if (isEditMode && editingId) {
        // Update Existing
        const updated = await supplierService.updateSupplier(editingId, formData as UpdateSupplierDTO)
        setSuppliers(prev => prev.map(s => s.id === editingId ? updated : s))
        showToast({
          title: "Supplier updated",
          message: `${updated.name} was updated successfully.`,
          variant: "success",
        })
      } else {
        // Create New
        const newSupplier = await supplierService.createSupplier(formData as CreateSupplierDTO)
        setSuppliers(prev => [newSupplier, ...prev])
        showToast({
          title: "Supplier created",
          message: `${newSupplier.name} was added to your supplier list.`,
          variant: "success",
        })
      }
      closeModal()
    } catch (err: unknown) {
      showToast({
        title: isEditMode ? "Update failed" : "Create failed",
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
    setFormData({ name: "", phone: null, email: null, address: null })
    setIsModalOpen(true)
  }

  function openEditModal(supplier: SupplierResponseDTO) {
    setIsEditMode(true)
    setEditingId(supplier.id)
    setFormData({
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingId(null)
    setIsEditMode(false)
    setFormData({ name: "", phone: null, email: null, address: null })
  }

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(term) ||
      (s.email ?? "").toLowerCase().includes(term)
    )
  }, [suppliers, searchTerm])

  const handleLogout = () => {
    clearAuthToken()
    showToast({ title: "Signed out", message: "You have been securely signed out.", variant: "success" })
    navigate("/login", { replace: true })
  }

  // Loading Skeleton
  if (loading) {
    return (
      <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
        <div className="max-w-5xl mx-auto px-8 py-12 space-y-8">
          <div className="h-10 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />)}
          </div>
        </div>
      </Sidebar>
    )
  }

  // Error State
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
            <span>Procurement</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-medium">Suppliers</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Suppliers</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">Manage your vendor relationships and contact information.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Suppliers", value: suppliers.length },
            { label: "With Email", value: suppliers.filter(s => s.email).length },
            { label: "With Phone", value: suppliers.filter(s => s.phone).length },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{stat.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
             <span className="px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">List View</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Icons.Search /></span>
              <input
                type="text"
                placeholder="Search suppliers..."
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

        {/* Table Card */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50/50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[30%]">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[30%]">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[25%]">Address</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[15%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400 italic">No suppliers found matching "{searchTerm}"</td></tr>
              ) : (
                filtered.map((supplier) => (
                  <tr key={supplier.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                          <Icons.Truck />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {supplier.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        {supplier.email && <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300"><span className="text-slate-400"><Icons.Mail /></span>{supplier.email}</div>}
                        {supplier.phone && <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><span className="text-slate-400"><Icons.Phone /></span>{supplier.phone}</div>}
                        {!supplier.email && !supplier.phone && <span className="text-sm text-slate-400">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {supplier.address ? (
                        <div className="flex items-start gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                          <span className="mt-0.5 text-slate-400"><Icons.MapPin /></span>
                          <span className="truncate max-w-[200px]">{supplier.address}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(supplier)}
                          className="p-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                          title="Edit"
                        >
                          <Icons.Edit />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
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
          
          {/* Footer Meta */}
          <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
             <p className="text-xs text-slate-500 dark:text-slate-400">Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span> of <span className="font-semibold text-slate-700 dark:text-slate-200">{suppliers.length}</span> suppliers</p>
          </div>
        </div>

        {/* Add/Edit Supplier Modal */}
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
                    {isEditMode ? "Edit Supplier" : "Add New Supplier"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {isEditMode ? "Update supplier details below" : "Enter supplier details below"}
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
                {/* Name */}
                <div>
                  <label htmlFor="supName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="supName"
                    type="text"
                    required
                    value={(formData as any).name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Acme Supplies Inc."
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    autoFocus
                  />
                </div>

                {/* Email & Phone Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="supEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email
                    </label>
                    <input
                      id="supEmail"
                      type="email"
                      value={formData.email ?? ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value || null })}
                      placeholder="contact@acme.com"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="supPhone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Phone
                    </label>
                    <input
                      id="supPhone"
                      type="tel"
                      value={formData.phone ?? ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value || null })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="supAddress" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Address
                  </label>
                  <input
                    id="supAddress"
                    type="text"
                    value={formData.address ?? ""}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value || null })}
                    placeholder="123 Industrial Park, City, Country"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
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
                    {submitting ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save Changes" : "Create Supplier")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  )
}