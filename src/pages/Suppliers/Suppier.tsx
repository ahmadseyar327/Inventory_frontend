import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router"
import { Loader2, Mail, MapPin, Phone, PhoneCall, Plus, Truck, AtSign } from "lucide-react"
import { useToast } from "../../contexts/useToast"
import Sidebar from "../../components/Sidebar/Sidebar"
import { type SupplierResponseDTO, type CreateSupplierDTO, type UpdateSupplierDTO } from "../../types/supplier.types"
import { supplierService } from "./Supplier.service"
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
  RowActions,
  SearchInput,
  StatCard,
  btnGhost,
  btnPrimary,
  card,
  cx,
  inputBase,
  th,
} from "../../components/ui/ui"

function emptyForm(): CreateSupplierDTO | UpdateSupplierDTO {
  return { name: "", phone: null, email: null, address: null }
}

export default function SuppliersPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [suppliers, setSuppliers] = useState<SupplierResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<CreateSupplierDTO | UpdateSupplierDTO>(emptyForm())
  const [submitting, setSubmitting] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<SupplierResponseDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

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
          showToast({ title: "Error", message, variant: "error" })
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void fetchSuppliers()
    return () => {
      isMounted = false
    }
  }, [showToast])

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await supplierService.deleteSupplier(pendingDelete.id)
      setSuppliers((prev) => prev.filter((s) => s.id !== pendingDelete.id))
      showToast({ title: "Deleted", message: "The supplier record was removed successfully.", variant: "success" })
      setPendingDelete(null)
    } catch (err: unknown) {
      showToast({ title: "Delete failed", message: err instanceof Error ? err.message : "Failed to delete supplier", variant: "error" })
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
        const updated = await supplierService.updateSupplier(editingId, formData as UpdateSupplierDTO)
        setSuppliers((prev) => prev.map((s) => (s.id === editingId ? updated : s)))
        showToast({ title: "Updated", message: `${updated.name} was updated successfully.`, variant: "success" })
      } else {
        const newSupplier = await supplierService.createSupplier(formData as CreateSupplierDTO)
        setSuppliers((prev) => [newSupplier, ...prev])
        showToast({ title: "Created", message: `${newSupplier.name} was added to your supplier list.`, variant: "success" })
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

  function openEditModal(supplier: SupplierResponseDTO) {
    setIsEditMode(true)
    setEditingId(supplier.id)
    setFormData({ name: supplier.name, phone: supplier.phone, email: supplier.email, address: supplier.address })
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
    return suppliers.filter((s) => s.name.toLowerCase().includes(term) || (s.email ?? "").toLowerCase().includes(term))
  }, [suppliers, searchTerm])

  const handleLogout = () => {
    clearAuthToken()
    showToast({ title: "Signed out", message: "You have been securely signed out.", variant: "success" })
    navigate("/login", { replace: true })
  }

  if (loading) {
    return (
      <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
        <PageShell>
          <PageSkeleton stats={3} rows={5} />
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

  const withEmail = suppliers.filter((s) => s.email).length
  const withPhone = suppliers.filter((s) => s.phone).length

  return (
    <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
      <PageShell>
        <PageHeader
          crumbs={["Workspace", "Procurement", "Suppliers"]}
          title="Suppliers"
          subtitle="Keep your vendor contacts organised and always within reach."
          action={
            <button type="button" onClick={openAddModal} className={btnPrimary}>
              <Plus className="h-4 w-4" /> New supplier
            </button>
          }
        />

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard index={0} label="Total suppliers" value={suppliers.length} tone="blue" icon={<Truck className="h-5 w-5" />} hint="Vendors you buy from" />
          <StatCard index={1} label="Reachable by email" value={withEmail} tone="violet" icon={<AtSign className="h-5 w-5" />} hint={`${suppliers.length - withEmail} without an email`} />
          <StatCard index={2} label="Reachable by phone" value={withPhone} tone="emerald" icon={<PhoneCall className="h-5 w-5" />} hint={`${suppliers.length - withPhone} without a phone`} />
        </div>

        <div className="mb-4">
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search by name or email" className="w-full sm:w-80" />
        </div>

        <div className={cx(card, "ui-rise overflow-hidden")} style={{ animationDelay: "200ms" }}>
          {suppliers.length === 0 ? (
            <EmptyState
              icon={<Truck className="h-6 w-6" />}
              title="No suppliers yet"
              description="Add the vendors you order from so their details are always handy."
              action={
                <button type="button" onClick={openAddModal} className={btnPrimary}>
                  <Plus className="h-4 w-4" /> Add supplier
                </button>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No suppliers match your search"
              description={`Nothing found for “${searchTerm}”. Try a different name or email.`}
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
                    <th className={th}>Supplier</th>
                    <th className={th}>Contact</th>
                    <th className={cx(th, "hidden md:table-cell")}>Address</th>
                    <th className={cx(th, "text-right")}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {filtered.map((supplier, i) => (
                    <tr
                      key={supplier.id}
                      className="ui-rise group transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-400/[0.06]"
                      style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={supplier.name} icon={<Truck className="h-5 w-5" />} />
                          <p className="truncate font-semibold text-slate-900 dark:text-white">{supplier.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          {supplier.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              {supplier.email}
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              {supplier.phone}
                            </div>
                          )}
                          {!supplier.email && !supplier.phone && <span className="text-sm text-slate-400">—</span>}
                        </div>
                      </td>
                      <td className="hidden px-5 py-3.5 md:table-cell">
                        {supplier.address ? (
                          <div className="flex max-w-[260px] items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{supplier.address}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <RowActions label={supplier.name} onEdit={() => openEditModal(supplier)} onDelete={() => setPendingDelete(supplier)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {suppliers.length > 0 && (
            <div className="border-t border-slate-200/80 bg-slate-50/60 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/30">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filtered.length}</span> of{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-200">{suppliers.length}</span> suppliers
              </p>
            </div>
          )}
        </div>

        <Modal
          open={isModalOpen}
          onClose={closeModal}
          title={isEditMode ? "Edit supplier" : "Add new supplier"}
          subtitle={isEditMode ? "Update the supplier details below." : "Enter the supplier details below."}
          icon={<Truck className="h-5 w-5" />}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Company name" required htmlFor="s-name">
              <input id="s-name" type="text" required autoFocus value={(formData as any).name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Acme Supplies Inc." className={inputBase} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Email" htmlFor="s-email">
                <input id="s-email" type="email" value={formData.email ?? ""} onChange={(e) => setFormData({ ...formData, email: e.target.value || null })} placeholder="contact@acme.com" className={inputBase} />
              </Field>
              <Field label="Phone" htmlFor="s-phone">
                <input id="s-phone" type="tel" value={formData.phone ?? ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value || null })} placeholder="+1 (555) 000-0000" className={inputBase} />
              </Field>
            </div>
            <Field label="Address" htmlFor="s-address">
              <input id="s-address" type="text" value={formData.address ?? ""} onChange={(e) => setFormData({ ...formData, address: e.target.value || null })} placeholder="123 Industrial Park, City" className={inputBase} />
            </Field>
            <div className="flex gap-3 border-t border-slate-200/80 pt-5 dark:border-slate-800">
              <button type="button" onClick={closeModal} className={cx(btnGhost, "flex-1")}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} className={cx(btnPrimary, "flex-1")}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? (isEditMode ? "Saving..." : "Creating...") : isEditMode ? "Save changes" : "Create supplier"}
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          open={pendingDelete !== null}
          title="Delete supplier?"
          message={
            <>
              <span className="font-semibold text-slate-900 dark:text-white">{pendingDelete?.name}</span> will be permanently removed from your supplier list. This can’t be undone.
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