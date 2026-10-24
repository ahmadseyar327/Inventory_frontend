import { useState, useEffect, useMemo } from "react"
import Sidebar from "../../components/Sidebar/Sidebar"
import { type CustomerResponseDTO, type CreateCustomerDTO } from "../../types/customer.types"
import { customerService } from "./Customer.service"

// --- Inline SVG Icons (Zero Dependencies) ---
const Icons = {
  Search: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Plus: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>,
  X: () => <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Trash: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Mail: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Phone: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  Building: () => <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  Moon: () => <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
  Sun: () => <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Users: () => <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [mounted, setMounted] = useState(false)
  const [darkMode, setDarkMode] = useState(() => 
    typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark'
  )
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<CreateCustomerDTO>({
    name: "", phone: null, email: null, address: null, company: null, status: "active", createdAt: null
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
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load customers")
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void fetchCustomers()
    return () => { isMounted = false }
  }, [])

  // Entrance Animation & Dark Mode
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  // Handlers
  async function handleDelete(id: number) {
    if (!window.confirm("Are you sure you want to delete this customer?")) return
    try {
      await customerService.deleteCustomer(id)
      setCustomers(prev => prev.filter(c => c.id !== id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete customer")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const newCustomer = await customerService.createCustomer(formData)
      setCustomers(prev => [newCustomer, ...prev])
      setIsModalOpen(false)
      setFormData({ name: "", phone: null, email: null, address: null, company: null, status: "active", createdAt: null })
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create customer")
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return customers.filter(c =>
      c.name.toLowerCase().includes(term) ||
      (c.email ?? "").toLowerCase().includes(term) ||
      (c.company ?? "").toLowerCase().includes(term)
    )
  }, [customers, searchTerm])

  const activeCount = customers.filter(c => c.status === "active").length
  const inactiveCount = customers.filter(c => c.status === "inactive").length

  const handleLogout = () => {
    localStorage.removeItem("token")
    window.location.href = "/login"
  }

  // Loading Skeleton
  if (loading) {
    return (
      <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
        <div className="space-y-6 p-6">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />)}
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </Sidebar>
    )
  }

  // Error State
  if (error) {
    return (
      <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">Retry</button>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
      <div className={`space-y-6 p-6 transition-opacity duration-700 ${mounted ? "opacity-100" : "opacity-0"}`}>
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Customers</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your customer relationships and track activity</p>
          </div>
          <div className="flex items-center gap-3">
            
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Icons.Search /></span>
              <input type="text" placeholder="Search customers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-72 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
            </div>
            <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/20 transition-all active:scale-95">
              <Icons.Plus /> Add Customer
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Customers", value: customers.length, color: "slate" },
            { label: "Active", value: activeCount, color: "slate" },
            { label: "Inactive", value: inactiveCount, color: "slate" },
          ].map((stat, i) => (
            <div key={i} className="group rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className={`mt-2 text-3xl font-bold tracking-tight ${stat.color === "blue" ? "text-blue-600 dark:text-blue-400" : stat.color === "emerald" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200"}`}>{stat.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Table Card */}
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50/80 dark:bg-slate-900/50">
                <tr>
                  {["Name", "Contact", "Company", "Status", ""].map((h) => (
                    <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">No customers found matching "{searchTerm}"</td></tr>
                ) : (
                  filtered.map((customer) => (
                    <tr key={customer.id} className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors duration-200">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">{customer.name.charAt(0).toUpperCase()}</div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{customer.name}</p>
                            {customer.address && <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{customer.address}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="space-y-1.5">
                          {customer.email && <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300"><span className="text-slate-400"><Icons.Mail /></span>{customer.email}</div>}
                          {customer.phone && <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><span className="text-slate-400"><Icons.Phone /></span>{customer.phone}</div>}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {customer.company ? <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300"><span className="text-slate-400"><Icons.Building /></span>{customer.company}</div> : <span className="text-sm text-slate-400">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${customer.status === "active" ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600"}`}>{customer.status ?? "Unknown"}</span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <button onClick={() => handleDelete(customer.id)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"><Icons.Trash /> Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-3 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span> of <span className="font-semibold text-slate-700 dark:text-slate-200">{customers.length}</span> customers</p>
          </div>
        </div>

        {/* Add Customer Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-2xl transform transition-all scale-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add New Customer</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"><Icons.X /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="John Doe" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <input type="email" value={formData.email ?? ""} onChange={e => setFormData({...formData, email: e.target.value || null})} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                    <input type="tel" value={formData.phone ?? ""} onChange={e => setFormData({...formData, phone: e.target.value || null})} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company</label>
                  <input type="text" value={formData.company ?? ""} onChange={e => setFormData({...formData, company: e.target.value || null})} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="Acme Corp" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                  <input type="text" value={formData.address ?? ""} onChange={e => setFormData({...formData, address: e.target.value || null})} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="123 Main St, City, Country" />
                </div>
                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? "Creating..." : "Create Customer"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  )
}