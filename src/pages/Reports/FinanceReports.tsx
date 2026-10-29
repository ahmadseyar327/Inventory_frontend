import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { Receipt, ShoppingCart, TrendingUp, Wallet } from "lucide-react"
import Sidebar from "../../components/Sidebar/Sidebar"
import { useToast } from "../../contexts/useToast"
import { clearAuthToken } from "../../services/api"
import reportsService, { type FinanceTrend } from "./Reports.service"
import { EmptyState, PageHeader, PageShell, card, cx } from "../../components/ui/ui"
import {
  DateRangeFilter,
  InlineError,
  LoadingBar,
  MetricCard,
  PagedTable,
  ProductDetailPanel,
  ProductSearch,
  ReportStyles,
  SlidingTabs,
  compact,
  fmtDate,
  fmtShort,
  money,
  num,
  parseDate,
  rangeLabel,
  resolveRange,
  useAsync,
  type DateRangeState,
  type SelectedProduct,
} from "./ReportKit"

/* ------------------------------------------------------------------ */
/* Trend chart                                                         */
/* ------------------------------------------------------------------ */

function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length === 0) return ""
  if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`
  let d = `M ${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    d += ` C ${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`
  }
  return d
}

function niceCeil(v: number) {
  const pow = Math.pow(10, Math.floor(Math.log10(v)))
  const f = v / pow
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
  return nf * pow
}

type SeriesKey = "sales" | "purchases"

const SERIES: { key: SeriesKey; label: string; stroke: string; gradient: string; dot: string }[] = [
  { key: "sales", label: "Sales", stroke: "url(#strokeSales)", gradient: "url(#fillSales)", dot: "bg-blue-500" },
  { key: "purchases", label: "Purchases", stroke: "url(#strokePurchases)", gradient: "url(#fillPurchases)", dot: "bg-amber-500" },
]

function TrendChart({ data }: { data: FinanceTrend[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const [hidden, setHidden] = useState<Record<SeriesKey, boolean>>({ sales: false, purchases: false })

  const sorted = useMemo(
    () => [...data].sort((a, b) => (parseDate(a.date)?.getTime() ?? 0) - (parseDate(b.date)?.getTime() ?? 0)),
    [data],
  )

  const W = 720
  const H = 300
  const padL = 54
  const padR = 18
  const padT = 18
  const padB = 34
  const n = sorted.length
  const maxV = Math.max(1, ...sorted.flatMap((d) => [d.sales, d.purchases]))
  const hi = niceCeil(maxV * 1.05)
  const x = (i: number) => (n === 1 ? padL + (W - padL - padR) / 2 : padL + (i / (n - 1)) * (W - padL - padR))
  const y = (v: number) => padT + (1 - v / hi) * (H - padT - padB)
  const ticks = [0, 1, 2, 3, 4].map((i) => (hi * i) / 4)

  const points = (key: SeriesKey) => sorted.map((d, i) => ({ x: x(i), y: y(d[key]) }))
  const baseY = H - padB

  const labelCount = Math.min(6, n)
  const xLabels = Array.from({ length: labelCount }, (_, i) => (labelCount === 1 ? 0 : Math.round((i / (labelCount - 1)) * (n - 1))))

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    if (n === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const rel = ((e.clientX - rect.left) / rect.width) * W
    const idx = n === 1 ? 0 : Math.round(((rel - padL) / (W - padL - padR)) * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, idx)))
  }

  if (n === 0) {
    return <EmptyState title="No trend data" description="There are no sales or purchases in the selected period." />
  }

  const hovered = hover !== null ? sorted[hover] : null
  const hx = hover !== null ? x(hover) : 0

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {SERIES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setHidden((h) => ({ ...h, [s.key]: !h[s.key] }))}
            aria-pressed={!hidden[s.key]}
            className={cx(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-300",
              hidden[s.key]
                ? "border-slate-200 text-slate-400 line-through dark:border-slate-700 dark:text-slate-500"
                : "border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
            )}
          >
            <span className={cx("h-2 w-2 rounded-full transition-opacity", s.dot, hidden[s.key] && "opacity-30")} />
            {s.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">Click a label to show or hide it</span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" onMouseMove={handleMove} onMouseLeave={() => setHover(null)} role="img" aria-label="Sales versus purchases trend">
          <defs>
            <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="fillPurchases" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="strokeSales" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="strokePurchases" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>

          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} strokeDasharray="3 5" className="stroke-slate-200 dark:stroke-slate-800" />
              <text x={padL - 10} y={y(t) + 4} textAnchor="end" fontSize="11" className="fill-slate-400 dark:fill-slate-500">
                {compact(t)}
              </text>
            </g>
          ))}

          {/* key forces the draw-in animation to replay when the data changes */}
          <g key={`${n}-${sorted[0]?.date}-${sorted[n - 1]?.date}`}>
            {SERIES.map((s) => {
              const pts = points(s.key)
              const line = smoothPath(pts)
              const area = n > 1 ? `${line} L ${pts[n - 1].x},${baseY} L ${pts[0].x},${baseY} Z` : ""
              return (
                <g key={s.key} style={{ opacity: hidden[s.key] ? 0 : 1, transition: "opacity .45s ease" }}>
                  {n > 1 && <path d={area} fill={s.gradient} className="ui-fade" />}
                  {n > 1 && <path d={line} pathLength={1} fill="none" stroke={s.stroke} strokeWidth="2.75" strokeLinecap="round" className="ui-draw" />}
                  {n <= 31 &&
                    pts.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r={n === 1 ? 5 : 2.5} fill={s.key === "sales" ? "#3b82f6" : "#f59e0b"} className="ui-fade" />
                    ))}
                </g>
              )
            })}
          </g>

          {xLabels.map((idx, i) => (
            <text key={`${idx}-${i}`} x={x(idx)} y={H - 10} textAnchor={i === 0 && n > 1 ? "start" : i === xLabels.length - 1 && n > 1 ? "end" : "middle"} fontSize="11" className="fill-slate-400 dark:fill-slate-500">
              {fmtShort(sorted[idx].date)}
            </text>
          ))}

          {hovered && (
            <g>
              <line x1={hx} x2={hx} y1={padT} y2={baseY} strokeDasharray="3 4" className="stroke-slate-300 dark:stroke-slate-600" />
              {SERIES.map((s) =>
                hidden[s.key] ? null : (
                  <g key={s.key}>
                    <circle cx={hx} cy={y(hovered[s.key])} r="9" fill={s.key === "sales" ? "#3b82f6" : "#f59e0b"} opacity="0.18" />
                    <circle cx={hx} cy={y(hovered[s.key])} r="4.5" strokeWidth="2.5" stroke={s.key === "sales" ? "#3b82f6" : "#f59e0b"} className="fill-white dark:fill-slate-900" />
                  </g>
                ),
              )}
            </g>
          )}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-[150px] rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2.5 text-xs shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-800/95"
            style={{ left: `${Math.max(14, Math.min(86, (hx / W) * 100))}%`, transform: "translateX(-50%)" }}
          >
            <p className="mb-1.5 font-medium text-slate-500 dark:text-slate-400">{fmtDate(hovered.date)}</p>
            <div className="space-y-1">
              <p className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><span className="h-2 w-2 rounded-full bg-blue-500" />Sales</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{money(hovered.sales)}</span>
              </p>
              <p className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><span className="h-2 w-2 rounded-full bg-amber-500" />Purchases</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{money(hovered.purchases)}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function FinanceReportsPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [range, setRange] = useState<DateRangeState>({ preset: "30d", from: "", to: "" })
  const [product, setProduct] = useState<SelectedProduct | null>(null)
  const [tab, setTab] = useState<"sales" | "purchases">("sales")

  const filters = resolveRange(range)
  const deps = [filters.fromDate, filters.toDate]
  const summary = useAsync(() => reportsService.getFinanceSummary(filters), deps)
  const trend = useAsync(() => reportsService.getFinanceTrend(filters), deps)

  const s = summary.data
  const net = s ? s.totalSales - s.totalPurchases : undefined
  const tableKey = `${tab}-${filters.fromDate ?? ""}-${filters.toDate ?? ""}`

  const handleLogout = () => {
    clearAuthToken()
    showToast({ title: "Signed out", message: "You have been securely signed out.", variant: "success" })
    navigate("/login", { replace: true })
  }

  return (
    <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
      <PageShell wide>
        <ReportStyles />
        <PageHeader
          crumbs={["Workspace", "Reports", "Finance"]}
          title="Finance reports"
          subtitle="Track sales and purchases over time, or search a product for its full financial story."
        />

        <section className={cx(card, "rp-enter relative z-20 mb-6 space-y-5 p-4 sm:p-5")}>
          <ProductSearch selected={product} onSelect={setProduct} hint="Search a product to see its sales and purchase history." />
          <div className="border-t border-slate-200/80 pt-5 dark:border-slate-800">
            <DateRangeFilter value={range} onChange={setRange} />
          </div>
        </section>

        {product ? (
          <div key={product.id} className="rp-fade">
            <ProductDetailPanel product={product} filters={filters} onClose={() => setProduct(null)} />
          </div>
        ) : (
          <div key="overview" className="space-y-6">
            {summary.error && !s ? (
              <InlineError message={summary.error} onRetry={summary.reload} />
            ) : (
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <MetricCard index={0} label="Total sales" value={s?.totalSales} format="money" tone="blue" icon={<TrendingUp className="h-5 w-5" />} hint={s ? `Average sale ${money(s.averageSaleValue)}` : undefined} />
                <MetricCard index={1} label="Total purchases" value={s?.totalPurchases} format="money" tone="amber" icon={<ShoppingCart className="h-5 w-5" />} hint={s ? `Average purchase ${money(s.averagePurchaseValue)}` : undefined} />
                <MetricCard index={2} label="Net result" value={net} format="money" tone={net !== undefined && net < 0 ? "rose" : "emerald"} icon={<Wallet className="h-5 w-5" />} hint="Sales minus purchases" />
                <MetricCard
                  index={3}
                  label="Transactions"
                  value={s ? s.totalSalesTransactions + s.totalPurchaseTransactions : undefined}
                  tone="violet"
                  icon={<Receipt className="h-5 w-5" />}
                  hint={s ? `${num(s.totalSalesTransactions)} sales · ${num(s.totalPurchaseTransactions)} purchases` : undefined}
                />
              </div>
            )}

            <section className={cx(card, "rp-enter relative overflow-hidden p-6")} style={{ animationDelay: "240ms" }}>
              <LoadingBar active={trend.loading} />
              <div className="mb-5">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Sales vs purchases</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{rangeLabel(range)} · hover the chart for daily details</p>
              </div>
              {trend.error && !trend.data ? (
                <InlineError message={trend.error} onRetry={trend.reload} />
              ) : trend.data ? (
                <TrendChart data={trend.data} />
              ) : (
                <div className="h-72 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
              )}
            </section>

            <section className={cx(card, "rp-enter relative overflow-hidden")} style={{ animationDelay: "320ms" }}>
              <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Transactions</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Every sale and purchase in the selected period.</p>
                </div>
                <SlidingTabs<"sales" | "purchases">
                  value={tab}
                  onChange={setTab}
                  options={[
                    { value: "sales", label: "Sales", badge: s?.totalSalesTransactions },
                    { value: "purchases", label: "Purchases", badge: s?.totalPurchaseTransactions },
                  ]}
                />
              </div>
              <div key={tab} className="rp-fade">
                {tab === "sales" ? (
                  <PagedTable
                    key={tableKey}
                    fetcher={(page, pageSize) => reportsService.getSalesReport({ ...filters, page, pageSize })}
                    deps={deps}
                    rowKey={(row) => row.saleId}
                    emptyTitle="No sales found"
                    emptyDescription="There are no sales in the selected date range."
                    columns={[
                      { key: "id", header: "Sale", cell: (row) => <span className="font-medium tabular-nums text-slate-500 dark:text-slate-400">#{row.saleId}</span> },
                      { key: "date", header: "Date", cell: (row) => <span className="text-slate-700 dark:text-slate-200">{fmtDate(row.saleDate)}</span> },
                      { key: "customer", header: "Customer", cell: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.customerName}</span> },
                      { key: "total", header: "Total", align: "right", cell: (row) => <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{money(row.total)}</span> },
                    ]}
                  />
                ) : (
                  <PagedTable
                    key={tableKey}
                    fetcher={(page, pageSize) => reportsService.getPurchasesReport({ ...filters, page, pageSize })}
                    deps={deps}
                    rowKey={(row) => row.purchaseId}
                    emptyTitle="No purchases found"
                    emptyDescription="There are no purchases in the selected date range."
                    columns={[
                      { key: "id", header: "Purchase", cell: (row) => <span className="font-medium tabular-nums text-slate-500 dark:text-slate-400">#{row.purchaseId}</span> },
                      { key: "date", header: "Date", cell: (row) => <span className="text-slate-700 dark:text-slate-200">{fmtDate(row.purchaseDate)}</span> },
                      { key: "supplier", header: "Supplier", cell: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.supplierName}</span> },
                      { key: "total", header: "Total", align: "right", cell: (row) => <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{money(row.total)}</span> },
                    ]}
                  />
                )}
              </div>
            </section>
          </div>
        )}
      </PageShell>
    </Sidebar>
  )
}