import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router"
import { useToast } from "../../contexts/useToast"
import Sidebar from "../../components/Sidebar/Sidebar"
import { type CustomerResponseDTO, type CreateCustomerDTO, type UpdateCustomerDTO } from "../../types/customer.types"
import { customerService } from "./Customer.service"
import { clearAuthToken } from "../../services/api"

// --- Inline SVG Icons (Zero Dependencies) ---
const Icons = {
  Search: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Plus: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>,
  X: () => <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Trash: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Mail: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Phone: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  Building: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  User: () => <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Edit: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
}

export default function CustomersPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [customers, setCustomers] = useState<CustomerResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  // Form Data (used for both Add and Edit)
  const [formData, setFormData] = useState<CreateCustomerDTO | UpdateCustomerDTO>({
    name: "", phone: null, email: null, address: null, status: "active", createdAt: null
  })
  const [submitting, setSubmitting] = useState(false)

  // Fetch Data
  useEffect(() => {
    let isMounted = true
    async function fetchCustomers() {
      try {
        const data = await customerService.getAllCustomers()
        if (isMounted) setCustomers(data)
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to load customers"
          setError(message)
          showToast({ title: "Customers could not be loaded", message, variant: "error" })
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void fetchCustomers()
    return () => { isMounted = false }
  }, [showToast])

  // Handlers
  async function handleDelete(id: number) {
    if (!window.confirm("Are you sure you want to delete this customer?")) return

    try {
      await customerService.deleteCustomer(id)
      setCustomers(prev => prev.filter(c => c.id !== id))
      showToast({
        title: "Customer deleted",
        message: "The customer record was removed successfully.",
        variant: "success",
      })
    } catch (err: unknown) {
      showToast({
        title: "Delete failed",
        message: err instanceof Error ? err.message : "Failed to delete customer",
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
        const updated = await customerService.updateCustomer(editingId, formData as UpdateCustomerDTO)
        setCustomers(prev => prev.map(c => c.id === editingId ? updated : c))
        showToast({
          title: "Customer updated",
          message: `${updated.name} was updated successfully.`,
          variant: "success",
        })
      } else {
        // Create New
        const newCustomer = await customerService.createCustomer(formData as CreateCustomerDTO)
        setCustomers(prev => [newCustomer, ...prev])
        showToast({
          title: "Customer created",
          message: `${newCustomer.name} was added to your customer list.`,
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
    setFormData({ name: "", phone: null, email: null, address: null, status: "active", createdAt: null })
    setIsModalOpen(true)
  }

  function openEditModal(customer: CustomerResponseDTO) {
    setIsEditMode(true)
    setEditingId(customer.id)
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      status: customer.status,
      // createdAt is usually read-only, but we include it if needed or ignore it in update
      createdAt: customer.createdAt 
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingId(null)
    setIsEditMode(false)
    setFormData({ name: "", phone: null, email: null, address: null, status: "active", createdAt: null })
  }

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return customers.filter(c =>
      c.name.toLowerCase().includes(term) ||
      (c.email ?? "").toLowerCase().includes(term)
    )
  }, [customers, searchTerm])

  const activeCount = customers.filter(c => c.status === "active").length
  const inactiveCount = customers.filter(c => c.status === "inactive").length

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
            <span>CRM</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-medium">Customers</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Customers</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">Manage your customer relationships and track activity.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Customers", value: customers.length },
            { label: "Active", value: activeCount },
            { label: "Inactive", value: inactiveCount },
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
                placeholder="Search customers..."
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
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[15%]">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[25%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400 italic">No customers found matching "{searchTerm}"</td></tr>
              ) : (
                filtered.map((customer) => (
                  <tr key={customer.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                          <Icons.User />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {customer.name}
                          </p>
                          {customer.address && <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{customer.address}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        {customer.email && <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300"><span className="text-slate-400"><Icons.Mail /></span>{customer.email}</div>}
                        {customer.phone && <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><span className="text-slate-400"><Icons.Phone /></span>{customer.phone}</div>}
                        {!customer.email && !customer.phone && <span className="text-sm text-slate-400">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        customer.status === "active" 
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 ring-emerald-600/20" 
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ring-slate-500/10"
                      }`}>
                        {customer.status ?? "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(customer)}
                          className="p-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                          title="Edit"
                        >
                          <Icons.Edit />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
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
             <p className="text-xs text-slate-500 dark:text-slate-400">Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span> of <span className="font-semibold text-slate-700 dark:text-slate-200">{customers.length}</span> customers</p>
          </div>
        </div>

        {/* Add/Edit Customer Modal */}
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
                    {isEditMode ? "Edit Customer" : "Add New Customer"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {isEditMode ? "Update customer details below" : "Enter customer details below"}
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
                  <label htmlFor="custName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="custName"
                    type="text"
                    required
                    value={(formData as any).name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    autoFocus
                  />
                </div>

                {/* Email & Phone Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="custEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email
                    </label>
                    <input
                      id="custEmail"
                      type="email"
                      value={formData.email ?? ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value || null })}
                      placeholder="john@example.com"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="custPhone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Phone
                    </label>
                    <input
                      id="custPhone"
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
                  <label htmlFor="custAddress" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Address
                  </label>
                  <input
                    id="custAddress"
                    type="text"
                    value={formData.address ?? ""}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value || null })}
                    placeholder="123 Main St, City, Country"
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
                    {submitting ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save Changes" : "Create Customer")}
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