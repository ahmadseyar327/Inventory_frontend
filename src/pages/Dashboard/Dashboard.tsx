import axios from "axios"
import { useEffect, useState } from "react"
import { dashboardService, type DashboardSummary } from "./Dashboard.service"

interface DashboardProps {
  onLogout: () => void
}

const summaryCards: {
  key: keyof DashboardSummary
  label: string
  description: string
}[] = [
  {
    key: "totalProducts",
    label: "Total products",
    description: "Products in your inventory",
  },
  {
    key: "lowStockItems",
    label: "Low stock",
    description: "Items that may need reordering",
  },
  {
    key: "totalCategories",
    label: "Categories",
    description: "Product categories",
  },
  {
    key: "totalSuppliers",
    label: "Suppliers",
    description: "Registered suppliers",
  },
]

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

export default function Dashboard({ onLogout }: DashboardProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
              Inventory ERP
            </p>
            <h1 className="mt-1 text-xl font-semibold">Dashboard</h1>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <section>
          <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
          <p className="mt-2 text-sm text-slate-600">
            A summary of your inventory and suppliers.
          </p>
        </section>

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

        <section
          aria-label="Inventory summary"
          aria-busy={loading}
          className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          {summaryCards.map((card) => (
            <article
              key={card.key}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-600">{card.label}</p>
              <p className="mt-4 text-3xl font-bold tracking-tight">
                {loading
                  ? "..."
                  : summary
                    ? summary[card.key].toLocaleString()
                    : "—"}
              </p>
              <p className="mt-2 text-sm text-slate-500">{card.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}