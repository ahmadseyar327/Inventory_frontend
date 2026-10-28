import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router"
import { Mail, MapPin, Phone, Plus, UserCheck, UserPlus, UserX, Users, Loader2 } from "lucide-react"
import { useToast } from "../../contexts/useToast"
import Sidebar from "../../components/Sidebar/Sidebar"
import { type CustomerResponseDTO, type CreateCustomerDTO, type UpdateCustomerDTO } from "../../types/customer.types"
import { customerService } from "./Customer.service"
import { clearAuthToken } from "../../services/api"
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

type StatusFilter = "all" | "active" | "inactive"

function emptyForm(): CreateCustomerDTO | UpdateCustomerDTO {
  return { name: "", phone: null, email: null, address: null, status: "active", createdAt: null }
}

function formatDate(value: unknown): string {
  if (!value) return "—"
  const date = new Date(value as string)
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function CustomersPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [customers, setCustomers] = useState<CustomerResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<CreateCustomerDTO | UpdateCustomerDTO>(emptyForm())
  const [submitting, setSubmitting] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<CustomerResponseDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

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
          showToast({ title: "Error", message, variant: "error" })
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void fetchCustomers()
    return () => {
      isMounted = false
    }
  }, [showToast])

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await customerService.deleteCustomer(pendingDelete.id)
      setCustomers((prev) => prev.filter((c) => c.id !== pendingDelete.id))
      showToast({ title: "Deleted", message: "The customer record was removed successfully.", variant: "success" })
      setPendingDelete(null)
    } catch (err: unknown) {
      showToast({ title: "Delete failed", message: err instanceof Error ? err.message : "Failed to delete customer", variant: "error" })
    } finally {
      setDeleting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!(formData as any).name?.trim()) {
      showToast({ title: "Validation Error", message: "Name is required", variant: "warning" })
      return
    }

    setSubmitting(true)
    try {
      if (isEditMode && editingId) {
        const updated = await customerService.updateCustomer(editingId, formData as UpdateCustomerDTO)
        setCustomers((prev) => prev.map((c) => (c.id === editingId ? updated : c)))
        showToast({ title: "Updated", message: `${updated.name} was updated successfully.`, variant: "success" })
      } else {
        const newCustomer = await customerService.createCustomer(formData as CreateCustomerDTO)
        setCustomers((prev) => [newCustomer, ...prev])
        showToast({ title: "Created", message: `${newCustomer.name} was added successfully.`, variant: "success" })
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

  function openEditModal(customer: CustomerResponseDTO) {
    setIsEditMode(true)
    setEditingId(customer.id)
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      status: customer.status,
      createdAt: customer.createdAt,
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingId(null)
    setIsEditMode(false)
    setFormData(emptyForm())
  }

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return customers.filter((c) => {
      const matchesText = c.name.toLowerCase().includes(term) || (c.email ?? "").toLowerCase().includes(term)
      const matchesStatus = statusFilter === "all" || c.status === statusFilter
      return matchesText && matchesStatus
    })
  }, [customers, searchTerm, statusFilter])

  const activeCount = customers.filter((c) => c.status === "active").length
  const inactiveCount = customers.filter((c) => c.status === "inactive").length
  const percent = (n: number) => (customers.length ? Math.round((n / customers.length) * 100) : 0)

  const handleLogout = () => {
    clearAuthToken()
    showToast({ title: "Signed out", message: "You have been securely signed out.", variant: "success" })
    navigate("/login", { replace: true })
  }

  if (loading) {
    return (
      <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
        <PageShell>
          <PageSkeleton stats={3} rows={6} />
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

  const hasFilters = searchTerm !== "" || statusFilter !== "all"

  return (
    <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
      <PageShell>
        <PageHeader
          crumbs={["Workspace", "CRM", "Customers"]}
          title="Customers"
          subtitle="Manage your customer relationships and keep track of who is active."
          action={
            <button type="button" onClick={openAddModal} className={btnPrimary}>
              <Plus className="h-4 w-4" /> New customer
            </button>
          }
        />

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard index={0} label="Total customers" value={customers.length} tone="blue" icon={<Users className="h-5 w-5" />} hint="Everyone in your CRM" />
          <StatCard index={1} label="Active" value={activeCount} tone="emerald" icon={<UserCheck className="h-5 w-5" />} hint={`${percent(activeCount)}% of all customers`} />
          <StatCard index={2} label="Inactive" value={inactiveCount} tone="slate" icon={<UserX className="h-5 w-5" />} hint={`${percent(inactiveCount)}% of all customers`} />
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search by name or email" className="w-full sm:w-80" />
          <Segmented<StatusFilter>
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </div>

        {/* Table */}
        <div className={cx(card, "ui-rise overflow-hidden")} style={{ animationDelay: "200ms" }}>
          {customers.length === 0 ? (
            <EmptyState
              icon={<UserPlus className="h-6 w-6" />}
              title="No customers yet"
              description="Add your first customer to start building your CRM."
              action={
                <button type="button" onClick={openAddModal} className={btnPrimary}>
                  <Plus className="h-4 w-4" /> Add customer
                </button>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No customers match your search"
              description={searchTerm ? `Nothing found for “${searchTerm}”. Try a different name or email.` : "No customers have this status."}
              action={
                hasFilters ? (
                  <button
                    type="button"
                    className={btnGhost}
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                    }}
                  >
                    Clear filters
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/30">
                  <tr>
                    <th className={th}>Customer</th>
                    <th className={th}>Contact</th>
                    <th className={th}>Status</th>
                    <th className={cx(th, "hidden md:table-cell")}>Added</th>
                    <th className={cx(th, "text-right")}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {filtered.map((customer, i) => (
                    <tr
                      key={customer.id}
                      className="ui-rise group transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-400/[0.06]"
                      style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={customer.name} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900 dark:text-white">{customer.name}</p>
                            {customer.address && (
                              <p className="mt-0.5 flex max-w-[220px] items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{customer.address}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              {customer.phone}
                            </div>
                          )}
                          {!customer.email && !customer.phone && <span className="text-sm text-slate-400">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Pill tone={customer.status === "active" ? "emerald" : "slate"}>
                          <span className="capitalize">{customer.status ?? "Unknown"}</span>
                        </Pill>
                      </td>
                      <td className="hidden px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 md:table-cell">{formatDate(customer.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <RowActions label={customer.name} onEdit={() => openEditModal(customer)} onDelete={() => setPendingDelete(customer)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {customers.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/60 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/30">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span> of{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-200">{customers.length}</span> customers
              </p>
            </div>
          )}
        </div>

        {/* Add / edit modal */}
        <Modal
          open={isModalOpen}
          onClose={closeModal}
          title={isEditMode ? "Edit customer" : "Add new customer"}
          subtitle={isEditMode ? "Update the customer details below." : "Enter the customer details below."}
          icon={<UserPlus className="h-5 w-5" />}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full name" required htmlFor="c-name">
              <input id="c-name" type="text" required autoFocus value={(formData as any).name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" className={inputBase} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Email" htmlFor="c-email">
                <input id="c-email" type="email" value={formData.email ?? ""} onChange={(e) => setFormData({ ...formData, email: e.target.value || null })} placeholder="john@example.com" className={inputBase} />
              </Field>
              <Field label="Phone" htmlFor="c-phone">
                <input id="c-phone" type="tel" value={formData.phone ?? ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value || null })} placeholder="+1 (555) 000-0000" className={inputBase} />
              </Field>
            </div>
            <Field label="Address" htmlFor="c-address">
              <input id="c-address" type="text" value={formData.address ?? ""} onChange={(e) => setFormData({ ...formData, address: e.target.value || null })} placeholder="123 Main St, City" className={inputBase} />
            </Field>
            <Field label="Status" htmlFor="c-status">
              <select
                id="c-status"
                value={formData.status ?? "active"}
                onChange={(e) => {
                  const status = e.target.value
                  if (status === "active" || status === "inactive") {
                    setFormData({ ...formData, status })
                  }
                }}
                className={inputBase}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
            <div className="flex gap-3 border-t border-slate-200/80 pt-5 dark:border-slate-800">
              <button type="button" onClick={closeModal} className={cx(btnGhost, "flex-1")}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} className={cx(btnPrimary, "flex-1")}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? (isEditMode ? "Saving..." : "Creating...") : isEditMode ? "Save changes" : "Create customer"}
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          open={pendingDelete !== null}
          title="Delete customer?"
          message={
            <>
              <span className="font-semibold text-slate-900 dark:text-white">{pendingDelete?.name}</span> will be permanently removed. This can’t be undone.
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