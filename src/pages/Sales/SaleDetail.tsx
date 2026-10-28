import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router"
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Package, 
  Users, 
  Trash2, 
  Pencil, 
  Loader2,
  CheckCircle2
} from "lucide-react"
import Sidebar from "../../components/Sidebar/Sidebar"
import { useToast } from "../../contexts/useToast"
import { clearAuthToken } from "../../services/api"
import { saleService } from "./Sale.service" // Adjust path as needed
import type { SaleResponseDTO } from "../../types/sales.types" // Adjust path as needed
import {
  ConfirmDialog,
  ErrorState,
  PageShell,
  PageSkeleton,
  Pill,
  btnGhost,
  btnDanger,
  card,
  cx,
  th,
} from "../../components/ui/ui"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", { 
    weekday: "long", 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  })
}

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  
  const [sale, setSale] = useState<SaleResponseDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function fetchSale() {
      if (!id) return
      try {
        setLoading(true)
        const data = await saleService.getById(Number(id))
        if (isMounted) setSale(data)
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to load sale details"
          setError(message)
          showToast({ title: "Error", message, variant: "error" })
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void fetchSale()
    return () => { isMounted = false }
  }, [id, showToast])

  async function handleDelete() {
    if (!sale) return
    setDeleting(true)
    try {
      await saleService.delete(sale.id)
      showToast({ title: "Deleted", message: "The sale record was removed successfully.", variant: "success" })
      navigate("/sales", { replace: true }) // Adjust route to your sales list
    } catch (err: unknown) {
      showToast({ title: "Delete failed", message: err instanceof Error ? err.message : "Failed to delete sale", variant: "error" })
    } finally {
      setDeleting(false)
      setIsDeleteModalOpen(false)
    }
  }

  const handleLogout = () => {
    clearAuthToken()
    showToast({ title: "Signed out", message: "You have been securely signed out.", variant: "success" })
    navigate("/login", { replace: true })
  }

  if (loading) {
    return (
      <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
        <PageShell>
          <PageSkeleton stats={4} rows={8} />
        </PageShell>
      </Sidebar>
    )
  }

  if (error || !sale) {
    return (
      <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
        <PageShell>
          <ErrorState message={error || "Sale not found."} onRetry={() => window.location.reload()} />
        </PageShell>
      </Sidebar>
    )
  }

  const totalUnits = sale.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
      <PageShell>
        {/* Header */}
        <div className="mb-8 ui-rise">
          <Link 
            to="/sales" // Adjust to your actual sales list route
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Sales
          </Link>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Sale #{sale.id}
                </h1>
                <Pill tone="emerald">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                </Pill>
              </div>
              <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> {formatDate(sale.saleDate)}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={() => navigate(`/sales/${sale.id}/edit`)} // Adjust route if you have an edit page
                className={cx(btnGhost)}
              >
                <Pencil className="h-4 w-4" /> Edit
              </button>
              <button 
                type="button" 
                onClick={() => setIsDeleteModalOpen(true)} 
                className={cx(btnDanger)}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 ui-rise" style={{ animationDelay: "100ms" }}>
          <div className={cx(card, "p-5 flex items-center gap-4")}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(sale.total)}</p>
            </div>
          </div>

          <div className={cx(card, "p-5 flex items-center gap-4")}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-500/20 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Customer</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{sale.customerName}</p>
            </div>
          </div>

          <div className={cx(card, "p-5 flex items-center gap-4")}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 ring-1 ring-inset ring-violet-500/20 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Units</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalUnits.toLocaleString()}</p>
            </div>
          </div>

          <div className={cx(card, "p-5 flex items-center gap-4")}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Line Items</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{sale.items.length}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className={cx(card, "ui-rise overflow-hidden")} style={{ animationDelay: "200ms" }}>
          <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Sale Items
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50/70 dark:bg-slate-800/30 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className={cx(th, "w-[40%]")}>Product</th>
                  <th className={cx(th, "text-right")}>Quantity</th>
                  <th className={cx(th, "text-right")}>Unit Price</th>
                  <th className={cx(th, "text-right")}>Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {sale.items.map((item, index) => (
                  <tr key={item.id} className="group hover:bg-emerald-50/40 dark:hover:bg-emerald-400/[0.06] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-xs">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{item.productName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Product ID: {item.productId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                        {item.quantity.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-slate-600 dark:text-slate-400 tabular-nums">
                        {formatCurrency(item.unitPrice)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-200/80 dark:border-slate-800">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Amount
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(sale.total)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          open={isDeleteModalOpen}
          title="Delete sale record?"
          message={
            <>
              Sale <span className="font-semibold text-slate-900 dark:text-white">#{sale.id}</span> to {sale.customerName} will be permanently removed. This action cannot be undone.
            </>
          }
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      </PageShell>
    </Sidebar>
  )
}