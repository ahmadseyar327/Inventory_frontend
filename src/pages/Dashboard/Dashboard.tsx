import axios from "axios"
import { useEffect, useState, type ReactNode } from "react"
import Sidebar from "../../components/Sidebar/Sidebar"
import { dashboardService, type DashboardSummary } from "./Dashboard.service"

interface DashboardProps {
  onLogout: () => void
}

const summaryCards: {
  key: keyof DashboardSummary
  label: string
  description: string
  icon: ReactNode
  trend: number
  color: "blue" | "emerald" | "amber" | "rose"
}[] = [
  {
    key: "totalProducts",
    label: "Total Products",
    description: "Products in inventory",
    icon: <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z M3.3 7 12 12l8.7-5 M12 22V12" />,
    trend: 12.5,
    color: "blue",
  },
  {
    key: "lowStockItems",
    label: "Low Stock Items",
    description: "Need reordering",
    icon: <><path d="M12 3 2.7 19.1A1.3 1.3 0 0 0 3.8 21h16.4a1.3 1.3 0 0 0 1.1-1.9L12 3Z" /><path d="M12 9v4m0 4h.01" /></>,
    trend: -8.3,
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
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
    gradient: "from-blue-500 to-blue-600",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-200",
    gradient: "from-emerald-500 to-emerald-600",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
    gradient: "from-amber-500 to-amber-600",
  },
  rose: {
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-200",
    gradient: "from-rose-500 to-rose-600",
  },
}

function Icon({
  children,
  className = "h-5 w-5",
}: {
  children: ReactNode
  className?: string
}) {
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
    return (
      error.response?.data?.message ??
      error.response?.data?.title ??
      error.message ??
      "Unable to load dashboard data."
    )
  }
  return "Unable to load dashboard data. Please try again."
}

// Generate mock historical data for charts
function generateTrendData(days: number, baseValue: number, variance: number) {
  const data = []
  let currentValue = baseValue
  for (let i = 0; i < days; i++) {
    currentValue += (Math.random() - 0.5) * variance
    currentValue = Math.max(0, currentValue)
    data.push(Math.round(currentValue))
  }
  return data
}

function AreaChart({ data, color = "blue" }: { data: number[]; color?: string }) {
  const width = 600
  const height = 200
  const padding = 20
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - 2 * padding)
    const y = height - padding - ((value - min) / range) * (height - 2 * padding)
    return `${x},${y}`
  })

  const pathD = `M ${points.join(" L ")}`
  const areaD = `${pathD} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`

  const gradientId = `gradient-${color}`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color === "blue" ? "#3b82f6" : "#10b981"} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color === "blue" ? "#3b82f6" : "#10b981"} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradientId})`} />
      <path d={pathD} fill="none" stroke={color === "blue" ? "#3b82f6" : "#10b981"} strokeWidth="2.5" />
    </svg>
  )
}

function BarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const width = 600
  const height = 250
  const padding = 40
  const safeData = data.map((value) =>
    Number.isFinite(value) ? Math.max(0, value) : 0,
  )
  const max = Math.max(1, ...safeData)
  const slotWidth =
    safeData.length > 0 ? (width - 2 * padding) / safeData.length : 0
  const barWidth = Math.max(0, slotWidth - 10)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {safeData.map((value, index) => {
        const barHeight = (value / max) * (height - 2 * padding)
        const x = padding + index * slotWidth + 5
        const y = height - padding - barHeight

        return (
          <g key={index}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx="4"
              className="fill-blue-500 hover:fill-blue-600 transition-colors"
            />
            <text
              x={x + barWidth / 2}
              y={height - padding + 20}
              textAnchor="middle"
              className="fill-slate-600 text-xs"
              fontSize="12"
            >
              {labels[index]}
            </text>
            <text
              x={x + barWidth / 2}
              y={y - 8}
              textAnchor="middle"
              className="fill-slate-700 font-semibold"
              fontSize="12"
            >
              {data[index]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function DonutChart({ healthy, low }: { healthy: number; low: number }) {
  const total = healthy + low
  const healthyPercent = (healthy / total) * 100
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const healthyStroke = (healthyPercent / 100) * circumference

  return (
    <div className="relative flex items-center justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="20"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="20"
          strokeDasharray={`${healthyStroke} ${circumference}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-900">{Math.round(healthyPercent)}%</span>
        <span className="text-sm text-slate-500">Healthy</span>
      </div>
    </div>
  )
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Generate mock data
  const trendData = generateTrendData(30, 500, 50)
  const categoryData = summary ? [summary.totalProducts, summary.totalCategories, summary.totalSuppliers, Math.round(summary.totalProducts * 0.3)] : [0, 0, 0, 0]
  const categoryLabels = ["Products", "Categories", "Suppliers", "Other"]

  useEffect(() => {
    let isMounted = true

    void dashboardService
      .getSummary()
      .then((data) => {
        if (isMounted) {
          setSummary(data)
        }
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setError(getErrorMessage(requestError))
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  async function handleRetry() {
    setLoading(true)
    setError("")

    try {
      const data = await dashboardService.getSummary()
      setSummary(data)
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  const stockHealthPercent =
    summary && summary.totalProducts > 0
      ? Math.round(
          Math.max(
            0,
            Math.min(
              100,
              ((summary.totalProducts - summary.lowStockItems) /
                summary.totalProducts) *
                100,
            ),
          ),
        )
      : null

  return (
    <Sidebar
      brandName="Inventory MIS"
      pageTitle="Dashboard"
      onLogout={onLogout}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-3 lg:mt-[-30px] lg:px-3">
        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="mt-8 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void handleRetry()}
              className="self-start rounded-lg border border-red-300 px-3 py-2 font-medium hover:bg-red-100 sm:self-auto"
            >
              Try again
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <section
          aria-label="Inventory summary"
          aria-busy={loading}
          className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {summaryCards.map((card) => {
            const colors = colorMap[card.color]
            return (
              <article
                key={card.key}
                id={card.key}
                className="scroll-mt-28 group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600">{card.label}</p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                      {loading ? "..." : summary ? summary[card.key].toLocaleString() : "—"}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          card.trend > 0
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        <Icon className="h-3 w-3">
                          {card.trend > 0 ? (
                            <polyline points="18 15 12 9 6 15" />
                          ) : (
                            <polyline points="6 9 12 15 18 9" />
                          )}
                        </Icon>
                        {Math.abs(card.trend)}%
                      </span>
                      <span className="text-xs text-slate-500">vs last month</span>
                    </div>
                  </div>
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors.bg} ${colors.text} transition group-hover:scale-110`}
                  >
                    <Icon className="h-6 w-6">{card.icon}</Icon>
                  </span>
                </div>
                <p className="mt-4 text-sm text-slate-500">{card.description}</p>
              </article>
            )
          })}
        </section>

        {/* Charts Section */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Inventory Trend Chart */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Inventory Trend</h3>
                <p className="mt-1 text-sm text-slate-500">Last 30 days</p>
              </div>
              <select className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option>Last 30 days</option>
                <option>Last 7 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
            <AreaChart data={trendData} color="blue" />
          </div>

          {/* Stock Health Donut */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="text-base font-semibold text-slate-900">Stock Health</h3>
              <p className="mt-1 text-sm text-slate-500">Current status</p>
            </div>
            <DonutChart
              healthy={summary ? summary.totalProducts - summary.lowStockItems : 0}
              low={summary ? summary.lowStockItems : 0}
            />
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-slate-600">Healthy Stock</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {summary ? (summary.totalProducts - summary.lowStockItems).toLocaleString() : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-sm text-slate-600">Low Stock</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {summary ? summary.lowStockItems.toLocaleString() : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-slate-900">Category Distribution</h3>
            <p className="mt-1 text-sm text-slate-500">Breakdown by category</p>
          </div>
          <BarChart data={categoryData} labels={categoryLabels} />
        </div>

        {/* Inventory Health Bar */}
        <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Inventory Health</h3>
              <p className="mt-1 text-sm text-slate-500">A quick view of your current stock status.</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Overview
            </span>
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-1000"
              style={{ width: `${Math.max(4, stockHealthPercent ?? 0)}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-xs text-slate-500">
            <span>Stock availability</span>
            <span>
              {stockHealthPercent === null
                ? "Waiting for inventory data"
                : `${stockHealthPercent}% healthy`}
            </span>
          </div>
        </section>

        {/* Low Stock Alert Table */}
        {summary && summary.lowStockItems > 0 && (
          <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Low Stock Alerts</h3>
                <p className="mt-1 text-sm text-slate-500">Items that need attention</p>
              </div>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View all →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Product
                    </th>
                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Category
                    </th>
                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Stock
                    </th>
                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 text-sm font-medium text-slate-900">Wireless Mouse</td>
                    <td className="py-4 text-sm text-slate-600">Electronics</td>
                    <td className="py-4 text-sm font-semibold text-slate-900">3</td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Low
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 text-sm font-medium text-slate-900">USB-C Cable</td>
                    <td className="py-4 text-sm text-slate-600">Accessories</td>
                    <td className="py-4 text-sm font-semibold text-slate-900">5</td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Low
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </Sidebar>
  )
}