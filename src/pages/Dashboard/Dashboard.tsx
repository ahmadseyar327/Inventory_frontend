import axios from "axios"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { ArrowUpRight, RefreshCw } from "lucide-react"
import Sidebar from "../../components/Sidebar/Sidebar"
import { useToast } from "../../contexts/useToast"
import { dashboardService, type DashboardSummary } from "./Dashboard.service"
import { PageHeader, PageShell, Pill, btnGhost, card, cx, th, useCountUp } from "../../components/ui/ui"

interface DashboardProps {
  onLogout: () => void
}

type Range = 7 | 30 | 90

const summaryCards: {
  key: keyof DashboardSummary
  label: string
  description: string
  icon: ReactNode
  trend: number
  /** When true, a falling number is good news (e.g. fewer low-stock items). */
  invert?: boolean
  color: "blue" | "emerald" | "amber" | "rose"
}[] = [
  {
    key: "totalProducts",
    label: "Total products",
    description: "Products in inventory",
    icon: <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z M3.3 7 12 12l8.7-5 M12 22V12" />,
    trend: 12.5,
    color: "blue",
  },
  {
    key: "lowStockItems",
    label: "Low stock items",
    description: "Need reordering",
    icon: <><path d="M12 3 2.7 19.1A1.3 1.3 0 0 0 3.8 21h16.4a1.3 1.3 0 0 0 1.1-1.9L12 3Z" /><path d="M12 9v4m0 4h.01" /></>,
    trend: -8.3,
    invert: true,
    color: "amber",
  },
  {
    key: "totalCategories",
    label: "Categories",
    description: "Product categories",
    icon: <><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="5" rx="2" /><rect x="13" y="10" width="8" height="11" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /></>,
    trend: 5.2,
    color: "emerald",
  },
  {
    key: "totalSuppliers",
    label: "Suppliers",
    description: "Active suppliers",
    icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    trend: 3.1,
    color: "rose",
  },
]

const colorMap = {
  blue: "bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20",
  emerald: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  amber: "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
  rose: "bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/20",
}

function Icon({ children, className = "h-5 w-5" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  )
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.response?.data?.title ?? error.message ?? "Unable to load dashboard data."
  }
  return "Unable to load dashboard data. Please try again."
}

/* ------------------------------------------------------------------ */
/* Sample data (charts are illustrative until a real endpoint exists)  */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Deterministic, so the chart doesn't jump around on every render. */
function generateTrendData(days: number, baseValue: number, variance: number) {
  const random = mulberry32(days * 7919)
  const data: number[] = []
  let current = baseValue
  for (let i = 0; i < days; i++) {
    current += (random() - 0.45) * variance
    current = Math.max(0, current)
    data.push(Math.round(current))
  }
  return data
}

/* ------------------------------------------------------------------ */
/* Charts                                                              */
/* ------------------------------------------------------------------ */

function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return ""
  let d = `M ${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`
  }
  return d
}

function AreaChart({ data, labels }: { data: number[]; labels: string[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 600
  const H = 240
  const padL = 44
  const padR = 16
  const padT = 16
  const padB = 28
  const max = Math.max(...data)
  const min = Math.min(...data)
  const pad = (max - min) * 0.12 || 1
  const lo = min - pad
  const hi = max + pad
  const x = (i: number) => padL + (i / (data.length - 1)) * (W - padL - padR)
  const y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB)
  const pts = data.map((v, i) => ({ x: x(i), y: y(v) }))
  const line = smoothPath(pts)
  const area = `${line} L ${pts[pts.length - 1].x},${H - padB} L ${pts[0].x},${H - padB} Z`
  const ticks = [0, 1, 2, 3].map((i) => lo + ((hi - lo) * i) / 3)
  const xLabels = [0, Math.floor((data.length - 1) / 2), data.length - 1]

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const rel = ((e.clientX - rect.left) / rect.width) * W
    const idx = Math.round(((rel - padL) / (W - padL - padR)) * (data.length - 1))
    setHover(Math.max(0, Math.min(data.length - 1, idx)))
  }

  const active = hover !== null ? pts[hover] : null

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" onMouseMove={handleMove} onMouseLeave={() => setHover(null)} role="img" aria-label="Inventory trend chart">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="areaStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>

        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} strokeDasharray="3 5" className="stroke-slate-200 dark:stroke-slate-800" />
            <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" className="fill-slate-400 dark:fill-slate-500">
              {Math.round(t)}
            </text>
          </g>
        ))}

        <path d={area} fill="url(#areaFill)" className="ui-fade" />
        <path d={line} pathLength={1} fill="none" stroke="url(#areaStroke)" strokeWidth="2.75" strokeLinecap="round" className="ui-draw" />

        {xLabels.map((idx, i) => (
          <text
            key={idx}
            x={x(idx)}
            y={H - 8}
            textAnchor={i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle"}
            fontSize="11"
            className="fill-slate-400 dark:fill-slate-500"
          >
            {labels[idx]}
          </text>
        ))}

        {active && (
          <g>
            <line x1={active.x} x2={active.x} y1={padT} y2={H - padB} className="stroke-slate-300 dark:stroke-slate-700" strokeDasharray="3 4" />
            <circle cx={active.x} cy={active.y} r="9" fill="#3b82f6" opacity="0.2" />
            <circle cx={active.x} cy={active.y} r="4.5" className="fill-white stroke-blue-500 dark:fill-slate-900" strokeWidth="2.5" />
          </g>
        )}
      </svg>

      {active && hover !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-800/95"
          style={{
            left: `${Math.max(12, Math.min(88, (active.x / W) * 100))}%`,
            top: `${(active.y / H) * 100}%`,
            transform: "translate(-50%, calc(-100% - 14px))",
          }}
        >
          <p className="text-slate-500 dark:text-slate-400">{labels[hover]}</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{data[hover].toLocaleString()} units</p>
        </div>
      )}
    </div>
  )
}

const barPalette = [
  ["#60a5fa", "#2563eb"],
  ["#a78bfa", "#7c3aed"],
  ["#34d399", "#059669"],
  ["#fbbf24", "#d97706"],
]

function BarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const W = 600
  const H = 260
  const padX = 24
  const padT = 28
  const padB = 36
  const safe = data.map((v) => (Number.isFinite(v) ? Math.max(0, v) : 0))
  const max = Math.max(1, ...safe)
  const slot = safe.length > 0 ? (W - 2 * padX) / safe.length : 0
  const barW = Math.min(72, Math.max(0, slot - 28))
  const baseline = H - padB

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Category distribution chart">
      <defs>
        {barPalette.map(([a, b], i) => (
          <linearGradient key={i} id={`bar-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={a} />
            <stop offset="100%" stopColor={b} />
          </linearGradient>
        ))}
      </defs>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={padX} x2={W - padX} y1={baseline - f * (baseline - padT)} y2={baseline - f * (baseline - padT)} strokeDasharray="3 5" className="stroke-slate-200 dark:stroke-slate-800" />
      ))}
      <line x1={padX} x2={W - padX} y1={baseline} y2={baseline} className="stroke-slate-300 dark:stroke-slate-700" />
      {safe.map((value, i) => {
        const h = (value / max) * (baseline - padT)
        const bx = padX + i * slot + (slot - barW) / 2
        const by = baseline - h
        return (
          <g key={i} className="group">
            <rect
              className="ui-grow transition-opacity group-hover:opacity-80"
              style={{ animationDelay: `${i * 90}ms` }}
              x={bx}
              y={by}
              width={barW}
              height={h}
              rx="8"
              fill={`url(#bar-${i % barPalette.length})`}
            />
            <text x={bx + barW / 2} y={by - 9} textAnchor="middle" fontSize="13" fontWeight="600" className="fill-slate-700 dark:fill-slate-200">
              {data[i]}
            </text>
            <text x={bx + barW / 2} y={H - 12} textAnchor="middle" fontSize="12" className="fill-slate-500 dark:fill-slate-400">
              {labels[i]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function DonutChart({ healthy, low }: { healthy: number; low: number }) {
  const total = healthy + low
  const radius = 78
  const c = 2 * Math.PI * radius
  const hLen = total > 0 ? (healthy / total) * c : 0
  const lLen = total > 0 ? (low / total) * c : 0
  const gap = hLen > 0 && lLen > 0 ? 8 : 0
  const percent = total > 0 ? Math.round((healthy / total) * 100) : null

  return (
    <div className="relative mx-auto flex h-52 w-52 items-center justify-center">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" role="img" aria-label="Stock health chart">
        <circle cx="100" cy="100" r={radius} fill="none" strokeWidth="18" className="stroke-slate-100 dark:stroke-slate-800" />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="18"
          strokeLinecap="round"
          style={{ strokeDasharray: `${Math.max(0, hLen - gap)} ${c}`, transition: "stroke-dasharray 1.1s cubic-bezier(.16,1,.3,1)" }}
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="18"
          strokeLinecap="round"
          style={{
            strokeDasharray: `${Math.max(0, lLen - gap)} ${c}`,
            strokeDashoffset: -hLen,
            transition: "stroke-dasharray 1.1s cubic-bezier(.16,1,.3,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">{percent === null ? "—" : `${percent}%`}</span>
        <span className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Healthy</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Summary card                                                        */
/* ------------------------------------------------------------------ */

function SummaryCard({
  card: cfg,
  value,
  loading,
  index,
}: {
  card: (typeof summaryCards)[number]
  value: number | null
  loading: boolean
  index: number
}) {
  const shown = useCountUp(value ?? 0)
  const good = (cfg.trend > 0) !== !!cfg.invert
  return (
    <article
      id={cfg.key}
      className={cx(
        card,
        "ui-rise group scroll-mt-28 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(37,99,235,0.35)] dark:hover:border-slate-700 sm:p-6",
      )}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{cfg.label}</p>
          {loading ? (
            <div className="mt-3 h-9 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          ) : (
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">
              {value === null ? "—" : shown.toLocaleString()}
            </p>
          )}
          <div className="mt-2.5 flex items-center gap-2">
            <span
              className={cx(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                good
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300",
              )}
            >
              <Icon className="h-3 w-3">{cfg.trend > 0 ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}</Icon>
              {Math.abs(cfg.trend)}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">vs last month</span>
          </div>
        </div>
        <span className={cx("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-transform duration-300 group-hover:scale-110", colorMap[cfg.color])}>
          <Icon className="h-6 w-6">{cfg.icon}</Icon>
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{cfg.description}</p>
    </article>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const lowStockSample = [
  { name: "Wireless Mouse", category: "Electronics", stock: 3 },
  { name: "USB-C Cable", category: "Accessories", stock: 5 },
]

export default function Dashboard({ onLogout }: DashboardProps) {
  const { showToast } = useToast()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [range, setRange] = useState<Range>(30)

  const trendData = useMemo(() => generateTrendData(range, 500, 50), [range])
  const trendLabels = useMemo(
    () =>
      Array.from({ length: range }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (range - 1 - i))
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      }),
    [range],
  )
  const categoryData = summary
    ? [summary.totalProducts, summary.totalCategories, summary.totalSuppliers, Math.round(summary.totalProducts * 0.3)]
    : [0, 0, 0, 0]
  const categoryLabels = ["Products", "Categories", "Suppliers", "Other"]

  useEffect(() => {
    let isMounted = true

    void dashboardService
      .getSummary()
      .then((data) => {
        if (isMounted) setSummary(data)
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          const message = getErrorMessage(requestError)
          setError(message)
          showToast({ title: "Dashboard could not be loaded", message, variant: "error" })
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [showToast])

  async function handleRetry() {
    setLoading(true)
    setError("")

    try {
      const data = await dashboardService.getSummary()
      setSummary(data)
      showToast({ title: "Dashboard refreshed", variant: "success" })
    } catch (requestError: unknown) {
      const message = getErrorMessage(requestError)
      setError(message)
      showToast({ title: "Dashboard refresh failed", message, variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  const stockHealthPercent =
    summary && summary.totalProducts > 0
      ? Math.round(Math.max(0, Math.min(100, ((summary.totalProducts - summary.lowStockItems) / summary.totalProducts) * 100)))
      : null

  const healthy = summary ? Math.max(0, summary.totalProducts - summary.lowStockItems) : 0
  const low = summary ? summary.lowStockItems : 0

  return (
    <Sidebar brandName="Inventory MIS" pageTitle="Dashboard" onLogout={onLogout}>
      <PageShell wide>
        <PageHeader
          crumbs={["Workspace", "Overview"]}
          title="Inventory overview"
          subtitle="A live snapshot of your products, stock health and suppliers."
          action={
            <button type="button" onClick={() => void handleRetry()} disabled={loading} className={btnGhost}>
              <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} /> Refresh
            </button>
          }
        />

        {/* Error alert */}
        {error && (
          <div
            role="alert"
            className="ui-pop mb-6 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void handleRetry()}
              className="self-start rounded-lg border border-rose-300 px-3 py-2 font-medium transition hover:bg-rose-100 dark:border-rose-400/40 dark:hover:bg-rose-400/10 sm:self-auto"
            >
              Try again
            </button>
          </div>
        )}

        {/* Summary cards */}
        <section aria-label="Inventory summary" aria-busy={loading} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((cfg, i) => (
            <SummaryCard key={cfg.key} card={cfg} value={summary ? summary[cfg.key] : null} loading={loading && !summary} index={i} />
          ))}
        </section>

        {/* Trend + donut */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className={cx(card, "ui-rise p-6 lg:col-span-2")} style={{ animationDelay: "280ms" }}>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Inventory trend</h3>
                  <Pill tone="slate" dot={false}>Sample data</Pill>
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Last {range} days · hover the chart for details</p>
              </div>
              <select
                value={range}
                onChange={(e) => setRange(Number(e.target.value) as Range)}
                aria-label="Time range"
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:[color-scheme:dark]"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
            <AreaChart key={range} data={trendData} labels={trendLabels} />
          </section>

          <section className={cx(card, "ui-rise p-6")} style={{ animationDelay: "350ms" }}>
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Stock health</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Current status</p>
            </div>
            <DonutChart healthy={healthy} low={low} />
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/50">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">Healthy stock</span>
                </div>
                <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{summary ? healthy.toLocaleString() : "—"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/50">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">Low stock</span>
                </div>
                <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{summary ? low.toLocaleString() : "—"}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Category + health */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className={cx(card, "ui-rise p-6 lg:col-span-2")} style={{ animationDelay: "420ms" }}>
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Category distribution</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Breakdown across your catalog</p>
            </div>
            <BarChart data={categoryData} labels={categoryLabels} />
          </section>

          <section className={cx(card, "ui-rise flex flex-col justify-between p-6")} style={{ animationDelay: "490ms" }}>
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Inventory health</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Stock availability right now</p>
                </div>
                <Pill tone="emerald">Overview</Pill>
              </div>
              <p className="mt-8 text-5xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">
                {stockHealthPercent === null ? "—" : `${stockHealthPercent}%`}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{stockHealthPercent === null ? "Waiting for inventory data" : "of products are healthy"}</p>
            </div>
            <div className="mt-8">
              <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-1000 ease-out"
                  style={{ width: `${Math.max(4, stockHealthPercent ?? 0)}%` }}
                />
              </div>
              <div className="mt-2.5 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Stock availability</span>
                <span>{low > 0 ? `${low} need attention` : "All good"}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Low stock alerts */}
        {summary && summary.lowStockItems > 0 && (
          <section className={cx(card, "ui-rise mt-6 overflow-hidden")} style={{ animationDelay: "560ms" }}>
            <div className="flex items-center justify-between gap-3 px-6 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Low stock alerts</h3>
                  <Pill tone="slate" dot={false}>Sample data</Pill>
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Items that need attention</p>
              </div>
              <button type="button" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                View all <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-y border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/30">
                  <tr>
                    <th className={th}>Product</th>
                    <th className={th}>Category</th>
                    <th className={th}>Stock</th>
                    <th className={th}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {lowStockSample.map((item) => (
                    <tr key={item.name} className="transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-400/[0.06]">
                      <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-white">{item.name}</td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{item.category}</td>
                      <td className="px-5 py-4">
                        <div className="w-28">
                          <p className="mb-1.5 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{item.stock}</p>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400" style={{ width: `${Math.min(100, item.stock * 8)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Pill tone="amber">Low</Pill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </PageShell>
    </Sidebar>
  )
}