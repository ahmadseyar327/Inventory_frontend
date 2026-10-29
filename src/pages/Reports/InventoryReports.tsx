import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { AlertTriangle, Boxes, ChevronRight, Package, PackageCheck, PackageX } from "lucide-react"
import Sidebar from "../../components/Sidebar/Sidebar"
import { useToast } from "../../contexts/useToast"
import { clearAuthToken } from "../../services/api"
import reportsService, { type InventoryProduct, type StockStatus } from "./Reports.service"
import { PageHeader, PageShell, Pill, SearchInput, card, cx, toneBar, type Tone } from "../../components/ui/ui"
import {
  DateRangeFilter,
  InlineError,
  MetricCard,
  PagedTable,
  ProductDetailPanel,
  ProductSearch,
  ReportStyles,
  SlidingTabs,
  money,
  num,
  resolveRange,
  useAsync,
  useDebounced,
  type DateRangeState,
  type SelectedProduct,
} from "./ReportKit"

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function statusTone(status: string): Tone {
  const s = status.toLowerCase()
  if (s.includes("out")) return "rose"
  if (s.includes("low")) return "amber"
  return "emerald"
}

/* ------------------------------------------------------------------ */
/* Stock donut                                                         */
/* ------------------------------------------------------------------ */

function StockDonut({ inStock, low, out }: { inStock: number; low: number; out: number }) {
  const total = inStock + low + out
  const r = 78
  const c = 2 * Math.PI * r
  const [ready, setReady] = useState(false)

  // Start empty, then fill on the next frame so the rings animate in.
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const segments = [
    { value: inStock, color: "#10b981" },
    { value: low, color: "#f59e0b" },
    { value: out, color: "#f43f5e" },
  ]
  const gap = segments.filter((s) => s.value > 0).length > 1 ? 7 : 0
  let offset = 0

  return (
    <div className="relative mx-auto flex h-56 w-56 items-center justify-center">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" role="img" aria-label="Stock distribution">
        <circle cx="100" cy="100" r={r} fill="none" strokeWidth="18" className="stroke-slate-100 dark:stroke-slate-800" />
        {segments.map((seg, i) => {
          const len = total > 0 ? (seg.value / total) * c : 0
          const start = offset
          offset += len
          return (
            <circle
              key={i}
              cx="100"
              cy="100"
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="18"
              strokeLinecap="round"
              style={{
                strokeDasharray: `${ready ? Math.max(0, len - gap) : 0} ${c}`,
                strokeDashoffset: -start,
                transition: `stroke-dasharray 1.2s cubic-bezier(.16,1,.3,1) ${i * 150}ms`,
              }}
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">
          {total > 0 ? `${Math.round((inStock / total) * 100)}%` : "—"}
        </span>
        <span className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">well stocked</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Product inventory cards (shown inside the product detail view)      */
/* ------------------------------------------------------------------ */

function ProductInventoryCards({ product }: { product: SelectedProduct }) {
  const row = useAsync(async () => {
    const res = await reportsService.getInventoryProducts({ search: product.name, page: 1, pageSize: 50 })
    return res.items.find((i) => i.productId === product.id) ?? null
  }, [product.id])

  const item = row.data
  const stock = item?.currentStock ?? product.currentStock

  if (row.error && !row.data) return <InlineError message={row.error} onRetry={row.reload} />

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <MetricCard index={0} label="Current stock" value={stock} tone="blue" icon={<Boxes className="h-5 w-5" />} hint="Units on hand" />
      <MetricCard index={1} label="Unit cost" value={row.loading && !item ? undefined : item?.unitCost ?? 0} format="money" tone="violet" icon={<Package className="h-5 w-5" />} hint={item && item.unitCost === null ? "No cost recorded yet" : "Cost per unit"} />
      <MetricCard index={2} label="Stock value" value={row.loading && !item ? undefined : item?.stockValue ?? 0} format="money" tone="emerald" icon={<PackageCheck className="h-5 w-5" />} hint={item && item.stockValue === null ? "No cost recorded yet" : "Units × unit cost"} />
      <div className={cx(card, "rp-enter p-5")} style={{ animationDelay: "240ms" }}>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Stock status</p>
        <div className="mt-4">
          {item ? <Pill tone={statusTone(item.stockStatus)}>{item.stockStatus}</Pill> : <div className="h-7 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />}
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Based on your stock thresholds</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const STATUS_OPTIONS: { value: StockStatus; label: string }[] = [
  { value: "All", label: "All" },
  { value: "In Stock", label: "In stock" },
  { value: "Low Stock", label: "Low stock" },
  { value: "Out of Stock", label: "Out of stock" },
]

export default function InventoryReportsPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const topRef = useRef<HTMLDivElement>(null)
  const [product, setProduct] = useState<SelectedProduct | null>(null)
  const [range, setRange] = useState<DateRangeState>({ preset: "all", from: "", to: "" })
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StockStatus>("All")
  const debouncedSearch = useDebounced(search, 350)

  const summary = useAsync(() => reportsService.getInventoryReport(), [])
  const s = summary.data
  const inStock = s ? Math.max(0, s.totalProducts - s.lowStockProducts - s.outOfStockProducts) : 0
  const pct = (n: number) => (s && s.totalProducts > 0 ? Math.round((n / s.totalProducts) * 100) : 0)

  const filters = resolveRange(range)
  const tableKey = `${debouncedSearch}|${status}`

  function openProduct(row: InventoryProduct) {
    setProduct({ id: row.productId, name: row.productName, productTypeName: row.productTypeName, currentStock: row.currentStock })
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handleLogout = () => {
    clearAuthToken()
    showToast({ title: "Signed out", message: "You have been securely signed out.", variant: "success" })
    navigate("/login", { replace: true })
  }

  return (
    <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
      <PageShell wide>
        <ReportStyles />
        <div ref={topRef} className="scroll-mt-6" />
        <PageHeader
          crumbs={["Workspace", "Reports", "Inventory"]}
          title="Inventory reports"
          subtitle="See how healthy your stock is, or search a product for its complete report."
        />

        <section className={cx(card, "rp-enter relative z-20 mb-6 p-4 sm:p-5")}>
          <ProductSearch selected={product} onSelect={setProduct} hint="Search a product to see its stock, sales and purchases." />
        </section>

        {product ? (
          <div key={product.id} className="rp-fade">
            <ProductDetailPanel
              product={product}
              filters={filters}
              onClose={() => setProduct(null)}
              extra={<ProductInventoryCards product={product} />}
              filterSlot={
                <div>
                  <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Sales and purchases period</p>
                  <DateRangeFilter value={range} onChange={setRange} />
                </div>
              }
            />
          </div>
        ) : (
          <div key="overview" className="space-y-6">
            {summary.error && !s ? (
              <InlineError message={summary.error} onRetry={summary.reload} />
            ) : (
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <MetricCard index={0} label="Total products" value={s?.totalProducts} tone="blue" icon={<Package className="h-5 w-5" />} hint="In your catalog" />
                <MetricCard index={1} label="Units in stock" value={s?.totalUnitsInStock} tone="violet" icon={<Boxes className="h-5 w-5" />} hint="Across all products" />
                <MetricCard index={2} label="Low stock" value={s?.lowStockProducts} tone="amber" icon={<AlertTriangle className="h-5 w-5" />} hint={s ? `${pct(s.lowStockProducts)}% of your catalog` : undefined} />
                <MetricCard index={3} label="Out of stock" value={s?.outOfStockProducts} tone="rose" icon={<PackageX className="h-5 w-5" />} hint={s ? `${pct(s.outOfStockProducts)}% of your catalog` : undefined} />
              </div>
            )}

            {s && (
              <section className={cx(card, "rp-enter grid items-center gap-8 p-6 md:grid-cols-[auto_1fr]")} style={{ animationDelay: "260ms" }}>
                <StockDonut inStock={inStock} low={s.lowStockProducts} out={s.outOfStockProducts} />
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Stock health</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">How your {num(s.totalProducts)} products are doing right now.</p>
                  <div className="mt-6 space-y-5">
                    {[
                      { label: "In stock", value: inStock, tone: "emerald" as Tone, dot: "bg-emerald-500" },
                      { label: "Low stock", value: s.lowStockProducts, tone: "amber" as Tone, dot: "bg-amber-500" },
                      { label: "Out of stock", value: s.outOfStockProducts, tone: "rose" as Tone, dot: "bg-rose-500" },
                    ].map((row, i) => (
                      <div key={row.label}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <span className={cx("h-2.5 w-2.5 rounded-full", row.dot)} />
                            {row.label}
                          </span>
                          <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                            {num(row.value)} <span className="font-normal text-slate-400">· {pct(row.value)}%</span>
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className={cx("rp-growx h-full rounded-full", toneBar[row.tone])} style={{ width: `${pct(row.value)}%`, animationDelay: `${300 + i * 150}ms` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section className={cx(card, "rp-enter relative overflow-hidden")} style={{ animationDelay: "340ms" }}>
              <div className="space-y-4 px-6 py-5">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Products</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Select any row to open that product's full report.</p>
                </div>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <SearchInput value={search} onChange={setSearch} placeholder="Filter by name" className="w-full lg:w-72" />
                  <div className="-mx-1 overflow-x-auto px-1 pb-1">
                    <SlidingTabs<StockStatus> value={status} onChange={setStatus} options={STATUS_OPTIONS} />
                  </div>
                </div>
              </div>

              <PagedTable
                key={tableKey}
                fetcher={(page, pageSize) =>
                  reportsService.getInventoryProducts({
                    page,
                    pageSize,
                    search: debouncedSearch.trim() || undefined,
                    stockStatus: status === "All" ? undefined : status,
                  })
                }
                deps={[debouncedSearch, status]}
                rowKey={(row) => row.productId}
                onRowClick={openProduct}
                emptyTitle="No products found"
                emptyDescription="Try a different search or stock filter."
                columns={[
                  {
                    key: "product",
                    header: "Product",
                    cell: (row) => (
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 transition-transform duration-300 group-hover:scale-110 dark:bg-blue-400/10 dark:text-blue-300">
                          <Package className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 dark:text-white">{row.productName}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{row.productTypeName}</p>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "stock",
                    header: "Stock",
                    cell: (row) => (
                      <span className="font-medium tabular-nums text-slate-800 dark:text-slate-100">
                        {num(row.currentStock)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">units</span>
                      </span>
                    ),
                  },
                  { key: "cost", header: "Unit cost", align: "right", hide: "md", cell: (row) => <span className="tabular-nums text-slate-600 dark:text-slate-300">{money(row.unitCost)}</span> },
                  { key: "value", header: "Stock value", align: "right", hide: "sm", cell: (row) => <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{money(row.stockValue)}</span> },
                  { key: "status", header: "Status", cell: (row) => <Pill tone={statusTone(row.stockStatus)}>{row.stockStatus}</Pill> },
                  {
                    key: "go",
                    header: "",
                    align: "right",
                    cell: () => <ChevronRight className="ml-auto h-4 w-4 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-blue-500 dark:text-slate-600" />,
                  },
                ]}
              />
            </section>
          </div>
        )}
      </PageShell>
    </Sidebar>
  )
}