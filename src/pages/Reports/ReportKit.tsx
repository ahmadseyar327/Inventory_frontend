import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react"
import axios from "axios"
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Package,
  RefreshCw,
  Search,
  X,
} from "lucide-react"
import { productService } from "../Products/Product.service"
import reportsService, { type DateFilters, type PagedResponse } from "./Reports.service"
import { EmptyState, Pill, btnGhost, card, cx, inputBase, th, toneBar, type Tone } from "../../components/ui/ui"

/* ================================================================== */
/* Formatters                                                          */
/* ================================================================== */

/** Change this if your shop doesn't use US dollars. */
const CURRENCY = "USD"

const moneyFmt = new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY })
const moneyFmt0 = new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY, maximumFractionDigits: 0 })
const compactFmt = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 })

export const money = (n: number | null | undefined) => (n === null || n === undefined ? "—" : moneyFmt.format(n))
export const moneyCard = (n: number) => (Math.abs(n) >= 10000 ? moneyFmt0.format(n) : moneyFmt.format(n))
export const compact = (n: number) => compactFmt.format(n)
export const num = (n: number | null | undefined) => (n === null || n === undefined ? "—" : n.toLocaleString("en-US"))

/** Parses "2026-10-28" as a local date (avoids the classic one-day timezone shift). */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function fmtDate(value: string | null | undefined) {
  const d = parseDate(value)
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"
}

export function fmtShort(value: string | null | undefined) {
  const d = parseDate(value)
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.response?.data?.title ?? error.message ?? "Something went wrong."
  }
  return error instanceof Error ? error.message : "Something went wrong. Please try again."
}

/* ================================================================== */
/* Hooks                                                               */
/* ================================================================== */

/**
 * Runs an async function whenever `deps` change. Keeps the previous data on screen
 * while the next request is loading, so the UI never flashes empty.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string }>({
    data: null,
    loading: true,
    error: "",
  })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function run() {
      setState((s) => ({ ...s, loading: true, error: "" }))
      try {
        const data = await fn()
        if (!cancelled) setState({ data, loading: false, error: "" })
      } catch (err: unknown) {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: getErrorMessage(err) }))
      }
    }
    void run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  return { ...state, reload: () => setTick((t) => t + 1) }
}

/** Smoothly animates from the previous number to the new one. */
export function useAnimatedNumber(target: number, duration = 1000) {
  const [value, setValue] = useState(0)
  const previous = useRef(0)

  useEffect(() => {
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const total = reduced ? 1 : duration
    const from = previous.current
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / total)
      const eased = 1 - Math.pow(1 - p, 4)
      const next = from + (target - from) * eased
      previous.current = next
      setValue(next)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}

export function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

/* ================================================================== */
/* Styles                                                              */
/* ================================================================== */

export function ReportStyles() {
  return (
    <style>{`
      @keyframes rp-growx { from { transform: scaleX(0) } to { transform: scaleX(1) } }
      @keyframes rp-fade { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
      @keyframes rp-drop { from { opacity: 0; transform: translateY(-6px) scale(.98) } to { opacity: 1; transform: none } }
      @keyframes rp-enter { from { opacity: 0; transform: translateY(20px) scale(.985) } to { opacity: 1; transform: none } }
      @keyframes rp-slide { 0% { transform: translateX(-100%) } 100% { transform: translateX(260%) } }
      .rp-growx { transform-origin: left center; animation: rp-growx .95s cubic-bezier(.16,1,.3,1) both }
      .rp-fade { animation: rp-fade .45s cubic-bezier(.16,1,.3,1) both }
      .rp-drop { animation: rp-drop .18s ease-out both }
      .rp-enter { animation: rp-enter .6s cubic-bezier(.16,1,.3,1) both }
      .rp-loadbar { animation: rp-slide 1.1s ease-in-out infinite }
      @media (prefers-reduced-motion: reduce) {
        .rp-growx, .rp-fade, .rp-drop, .rp-enter, .rp-loadbar { animation: none }
      }
    `}</style>
  )
}

const iconTone: Record<Tone, string> = {
  blue: "bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20",
  emerald: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  amber: "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
  rose: "bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/20",
  violet: "bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20",
  slate: "bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/20",
}

/* ================================================================== */
/* Small UI pieces                                                     */
/* ================================================================== */

export function LoadingBar({ active }: { active: boolean }) {
  return (
    <div className={cx("pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden transition-opacity duration-300", active ? "opacity-100" : "opacity-0")}>
      <div className="rp-loadbar h-full w-2/5 rounded-full bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
    </div>
  )
}

export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rp-fade flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-center gap-2.5">
        <AlertCircle className="h-5 w-5 shrink-0" /> {message}
      </span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 self-start rounded-lg border border-rose-300 px-3 py-1.5 font-medium transition hover:bg-rose-100 dark:border-rose-400/40 dark:hover:bg-rose-400/10 sm:self-auto">
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      )}
    </div>
  )
}

export function SlidingTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; icon?: ReactNode; badge?: string | number }[]
}) {
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  const n = options.length
  return (
    <div role="tablist" className="relative inline-grid rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
      <span
        aria-hidden
        className="absolute bottom-1 left-1 top-1 rounded-lg bg-white shadow-sm transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] dark:bg-slate-700"
        style={{ width: `calc((100% - 8px) / ${n})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cx(
              "relative z-10 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors duration-300",
              active ? "text-blue-600 dark:text-blue-300" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
            )}
          >
            {o.icon}
            {o.label}
            {o.badge !== undefined && (
              <span className="rounded-full bg-slate-200/80 px-1.5 py-px text-[11px] tabular-nums dark:bg-slate-600/60">{o.badge}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function MetricCard({
  label,
  value,
  format = "number",
  tone = "blue",
  icon,
  hint,
  index = 0,
}: {
  label: string
  value: number | undefined
  format?: "money" | "number"
  tone?: Tone
  icon: ReactNode
  hint?: ReactNode
  index?: number
}) {
  const animated = useAnimatedNumber(value ?? 0)
  const text = format === "money" ? moneyCard(animated) : Math.round(animated).toLocaleString("en-US")
  return (
    <div
      className={cx(card, "rp-enter group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(37,99,235,0.4)] dark:hover:border-slate-700")}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          {value === undefined ? (
            <div className="mt-3 h-9 w-32 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          ) : (
            <p className="mt-2 truncate text-3xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">{text}</p>
          )}
        </div>
        <span className={cx("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3", iconTone[tone])}>
          {icon}
        </span>
      </div>
      {hint && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  )
}

/* ================================================================== */
/* Date range                                                          */
/* ================================================================== */

export type Preset = "7d" | "30d" | "90d" | "year" | "all" | "custom"

export interface DateRangeState {
  preset: Preset
  from: string
  to: string
}

const PRESETS: { value: Preset; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom" },
]

export function toISODate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function addDays(d: Date, days: number) {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function resolveRange(r: DateRangeState): DateFilters {
  const today = new Date()
  switch (r.preset) {
    case "7d":
      return { fromDate: toISODate(addDays(today, -6)), toDate: toISODate(today) }
    case "30d":
      return { fromDate: toISODate(addDays(today, -29)), toDate: toISODate(today) }
    case "90d":
      return { fromDate: toISODate(addDays(today, -89)), toDate: toISODate(today) }
    case "year":
      return { fromDate: `${today.getFullYear()}-01-01`, toDate: toISODate(today) }
    case "all":
      return {}
    case "custom":
      return { fromDate: r.from || undefined, toDate: r.to || undefined }
  }
}

export function rangeLabel(r: DateRangeState) {
  const f = resolveRange(r)
  if (!f.fromDate && !f.toDate) return "All time"
  if (f.fromDate && f.toDate) return `${fmtDate(f.fromDate)} – ${fmtDate(f.toDate)}`
  if (f.fromDate) return `Since ${fmtDate(f.fromDate)}`
  return `Until ${fmtDate(f.toDate)}`
}

export function DateRangeFilter({ value, onChange }: { value: DateRangeState; onChange: (v: DateRangeState) => void }) {
  const custom = value.preset === "custom"

  function setPreset(p: Preset) {
    if (p === "custom") {
      const r = resolveRange(value)
      onChange({
        preset: "custom",
        from: r.fromDate ?? toISODate(addDays(new Date(), -29)),
        to: r.toDate ?? toISODate(new Date()),
      })
    } else {
      onChange({ ...value, preset: p })
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <SlidingTabs<Preset> value={value.preset} onChange={setPreset} options={PRESETS} />
        </div>
        <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <CalendarDays className="h-4 w-4" />
          <span key={rangeLabel(value)} className="rp-fade font-medium text-slate-700 dark:text-slate-200">
            {rangeLabel(value)}
          </span>
        </p>
      </div>

      <div className={cx("grid transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]", custom ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")} aria-hidden={!custom}>
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 gap-3 p-0.5 sm:max-w-md sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">From</span>
              <input
                type="date"
                tabIndex={custom ? 0 : -1}
                value={value.from}
                onChange={(e) => onChange({ ...value, from: e.target.value, to: value.to && e.target.value > value.to ? e.target.value : value.to })}
                className={inputBase}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">To</span>
              <input
                type="date"
                tabIndex={custom ? 0 : -1}
                value={value.to}
                onChange={(e) => onChange({ ...value, to: e.target.value, from: value.from && e.target.value < value.from ? e.target.value : value.from })}
                className={inputBase}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/* Product search                                                      */
/* ================================================================== */

export interface SelectedProduct {
  id: number
  name: string
  productTypeName: string
  currentStock: number
}

function Highlight({ text, term }: { text: string; term: string }) {
  const t = term.trim()
  if (!t) return <>{text}</>
  const i = text.toLowerCase().indexOf(t.toLowerCase())
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-blue-100 px-0.5 text-inherit dark:bg-blue-400/25">{text.slice(i, i + t.length)}</mark>
      {text.slice(i + t.length)}
    </>
  )
}

export function ProductSearch({
  selected,
  onSelect,
  label = "Product report",
  hint = "Search any product to see its full report.",
}: {
  selected: SelectedProduct | null
  onSelect: (p: SelectedProduct | null) => void
  label?: string
  hint?: string
}) {
  const { data: products, loading, error, reload } = useAsync(() => productService.getAllProducts(), [])
  const [query, setQuery] = useState("")
  const [typing, setTyping] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const value = typing || !selected ? query : selected.name
  const term = typing ? query : ""

  const { matches, total } = useMemo(() => {
    const list = products ?? []
    const t = term.trim().toLowerCase()
    const filtered = t ? list.filter((p) => p.name.toLowerCase().includes(t) || p.productTypeName.toLowerCase().includes(t)) : list
    return { matches: filtered.slice(0, 8), total: filtered.length }
  }, [products, term])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
        setTyping(false)
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  function pick(p: (typeof matches)[number]) {
    onSelect({ id: p.id, name: p.name, productTypeName: p.productTypeName, currentStock: p.currentStock })
    setTyping(false)
    setQuery("")
    setOpen(false)
  }

  function clear() {
    onSelect(null)
    setQuery("")
    setTyping(false)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, Math.max(0, matches.length - 1)))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && open && matches[active]) {
      e.preventDefault()
      pick(matches[active])
    } else if (e.key === "Escape") {
      setOpen(false)
      setTyping(false)
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={`${listId}-input`} className="text-sm font-semibold text-slate-900 dark:text-white">
          {label}
        </label>
        <span className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">{hint}</span>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          id={`${listId}-input`}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setQuery(e.target.value)
            setTyping(true)
            setOpen(true)
            setActive(0)
          }}
          onFocus={(e) => {
            setOpen(true)
            e.currentTarget.select()
          }}
          onKeyDown={onKeyDown}
          placeholder="Search products by name or type..."
          className={cx(inputBase, "py-3 pl-12 pr-11 text-[15px]", selected && !typing && "font-semibold")}
        />
        {(selected || query) && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear product"
            className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-200 text-slate-500 transition hover:rotate-90 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div
          id={listId}
          role="listbox"
          className="rp-drop absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-900"
        >
          {loading && !products ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center justify-between gap-3 p-4 text-sm text-rose-600 dark:text-rose-300">
              <span>{error}</span>
              <button type="button" onClick={reload} className={btnGhost}>
                Retry
              </button>
            </div>
          ) : matches.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">No products match “{query}”.</p>
          ) : (
            <>
              <ul className="max-h-80 overflow-y-auto p-1.5">
                {matches.map((p, i) => (
                  <li key={p.id} role="option" aria-selected={selected?.id === p.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => pick(p)}
                      className={cx(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                        i === active ? "bg-blue-50 dark:bg-blue-400/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/60",
                      )}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
                        <Package className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                          <Highlight text={p.name} term={term} />
                        </span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                          <Highlight text={p.productTypeName} term={term} />
                        </span>
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">{num(p.currentStock)} in stock</span>
                      <ChevronRight className={cx("h-4 w-4 shrink-0 text-slate-400 transition-transform", i === active && "translate-x-0.5 text-blue-500")} />
                    </button>
                  </li>
                ))}
              </ul>
              {total > matches.length && (
                <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  +{total - matches.length} more. Keep typing to narrow it down.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/* Tables                                                              */
/* ================================================================== */

export interface Column<T> {
  key: string
  header: string
  align?: "right"
  hide?: "sm" | "md"
  cell: (row: T) => ReactNode
}

const hideClass = { sm: "hidden sm:table-cell", md: "hidden md:table-cell" }

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  dim,
  onRowClick,
  emptyTitle,
  emptyDescription,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  loading?: boolean
  dim?: boolean
  onRowClick?: (row: T) => void
  emptyTitle: string
  emptyDescription: string
}) {
  if (!loading && rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="border-y border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/30">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={cx(th, c.align === "right" && "text-right", c.hide && hideClass[c.hide])}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cx("divide-y divide-slate-100 transition-opacity duration-300 dark:divide-slate-800/70", dim && "opacity-50")}>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c.key} className={cx("px-5 py-4", c.hide && hideClass[c.hide])}>
                      <div className="h-4 animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800" style={{ width: `${55 + ((i * 17 + c.key.length * 9) % 40)}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row, i) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={onRowClick ? (e) => e.key === "Enter" && onRowClick(row) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  className={cx(
                    "rp-fade group transition-colors hover:bg-blue-50/60 dark:hover:bg-blue-400/[0.07]",
                    onRowClick && "cursor-pointer focus:outline-none focus-visible:bg-blue-50 dark:focus-visible:bg-blue-400/10",
                  )}
                  style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cx("px-5 py-3.5 text-sm", c.align === "right" && "text-right", c.hide && hideClass[c.hide])}>
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}

export function Pager({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPage,
}: {
  page: number
  totalPages: number
  totalCount: number
  pageSize: number
  onPage: (p: number) => void
}) {
  if (totalCount === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(totalCount, page * pageSize)

  const pages: (number | "gap-a" | "gap-b")[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push("gap-a")
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push("gap-b")
    pages.push(totalPages)
  }

  const btn =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200/80 bg-slate-50/60 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Showing <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">{from}–{to}</span> of{" "}
        <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">{totalCount.toLocaleString()}</span>
      </p>
      <nav aria-label="Pagination" className="flex items-center gap-1">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page" className={cx(btn, "text-slate-500 hover:bg-white disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-700")}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p) =>
          typeof p === "number" ? (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              aria-current={p === page ? "page" : undefined}
              className={cx(btn, "tabular-nums", p === page ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30" : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700")}
            >
              {p}
            </button>
          ) : (
            <span key={p} className="px-1 text-slate-400">…</span>
          ),
        )}
        <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page" className={cx(btn, "text-slate-500 hover:bg-white disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-700")}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  )
}

export const PAGE_SIZE = 10

/** A paginated table. Give it a `key` that changes with your filters so it resets to page 1. */
export function PagedTable<T>({
  fetcher,
  deps,
  columns,
  rowKey,
  onRowClick,
  emptyTitle,
  emptyDescription,
}: {
  fetcher: (page: number, pageSize: number) => Promise<PagedResponse<T>>
  deps: unknown[]
  columns: Column<T>[]
  rowKey: (row: T) => string | number
  onRowClick?: (row: T) => void
  emptyTitle: string
  emptyDescription: string
}) {
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useAsync(() => fetcher(page, PAGE_SIZE), [page, ...deps])

  if (error && !data) {
    return (
      <div className="p-5">
        <InlineError message={error} onRetry={reload} />
      </div>
    )
  }

  return (
    <div className="relative">
      <LoadingBar active={loading} />
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={rowKey}
        loading={loading && !data}
        dim={loading && !!data}
        onRowClick={onRowClick}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
      {data && (
        <Pager page={data.page} totalPages={data.totalPages} totalCount={data.totalCount} pageSize={data.pageSize} onPage={setPage} />
      )}
    </div>
  )
}

/* ================================================================== */
/* Product detail                                                      */
/* ================================================================== */

function CompareRow({
  label,
  a,
  b,
  format,
  aName,
  bName,
}: {
  label: string
  a: number
  b: number
  format: (n: number) => string
  aName: string
  bName: string
}) {
  const max = Math.max(a, b, 1)
  const row = (name: string, value: number, tone: Tone, delay: number) => (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs text-slate-500 dark:text-slate-400">{name}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={cx("rp-growx h-full rounded-full", toneBar[tone])} style={{ width: `${Math.max(value > 0 ? 3 : 0, (value / max) * 100)}%`, animationDelay: `${delay}ms` }} />
      </div>
      <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{format(value)}</span>
    </div>
  )
  return (
    <div>
      <p className="mb-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
      <div className="space-y-2.5">
        {row(aName, a, "blue", 120)}
        {row(bName, b, "amber", 240)}
      </div>
    </div>
  )
}

export function ProductDetailPanel({
  product,
  filters,
  onClose,
  extra,
  filterSlot,
}: {
  product: SelectedProduct
  filters: DateFilters
  onClose: () => void
  /** Anything extra to show under the hero (the inventory page adds stock cards here). */
  extra?: ReactNode
  /** Optional date filter shown above the finance section. */
  filterSlot?: ReactNode
}) {
  const report = useAsync(() => reportsService.getProductFinanceReport(product.id, filters), [product.id, filters.fromDate, filters.toDate])
  const [tab, setTab] = useState<"sales" | "purchases">("sales")
  const r = report.data
  const net = r ? r.totalSalesRevenue - r.totalPurchaseValue : undefined
  const historyKey = `${product.id}-${filters.fromDate ?? ""}-${filters.toDate ?? ""}`

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className={cx(card, "rp-enter relative overflow-hidden")}>
        <div className="h-20 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600">
          <div className="h-full w-full opacity-30" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,.6) 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        </div>
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="-mt-9 flex items-end gap-4">
            <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-xl ring-4 ring-white dark:bg-slate-800 dark:text-blue-300 dark:ring-slate-900">
              <Package className="h-8 w-8" />
            </span>
            <div className="pb-1">
              <h2 className="break-words text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{product.name}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Pill tone="blue" dot={false}>{product.productTypeName}</Pill>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">{num(product.currentStock)}</span> units in stock
                </span>
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className={btnGhost}>
            <ArrowLeft className="h-4 w-4" /> Back to overview
          </button>
        </div>
      </section>

      {extra}
      {filterSlot && <section className={cx(card, "rp-enter p-4 sm:p-5")} style={{ animationDelay: "120ms" }}>{filterSlot}</section>}

      {report.error && !r ? (
        <InlineError message={report.error} onRetry={report.reload} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <MetricCard index={0} label="Sales revenue" value={r?.totalSalesRevenue} format="money" tone="blue" icon={<DollarIcon />} hint={r ? `${num(r.salesTransactions)} sales transactions` : undefined} />
            <MetricCard index={1} label="Purchase value" value={r?.totalPurchaseValue} format="money" tone="amber" icon={<CartIcon />} hint={r ? `${num(r.purchaseTransactions)} purchase transactions` : undefined} />
            <MetricCard index={2} label="Units sold" value={r?.quantitySold} tone="emerald" icon={<ArrowUpIcon />} hint="In the selected period" />
            <MetricCard index={3} label="Units purchased" value={r?.quantityPurchased} tone="violet" icon={<ArrowDownIcon />} hint="In the selected period" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className={cx(card, "rp-enter relative overflow-hidden p-6 lg:col-span-2")} style={{ animationDelay: "200ms" }}>
              <LoadingBar active={report.loading} />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Sold vs purchased</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">How this product moved in and out.</p>
              <div className="mt-6 space-y-7">
                <CompareRow label="Units" a={r?.quantitySold ?? 0} b={r?.quantityPurchased ?? 0} format={num} aName="Sold" bName="Purchased" />
                <CompareRow label="Value" a={r?.totalSalesRevenue ?? 0} b={r?.totalPurchaseValue ?? 0} format={(n) => money(n)} aName="Revenue" bName="Purchases" />
              </div>
              {net !== undefined && (
                <div className={cx("mt-7 flex items-center justify-between rounded-xl px-4 py-3 text-sm", net >= 0 ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300" : "bg-rose-50 text-rose-800 dark:bg-rose-400/10 dark:text-rose-300")}>
                  <span className="font-medium">Revenue minus purchases</span>
                  <span className="text-base font-semibold tabular-nums">{money(net)}</span>
                </div>
              )}
            </section>

            <section className={cx(card, "rp-enter p-6")} style={{ animationDelay: "280ms" }}>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Activity</h3>
              <dl className="mt-5 space-y-4 text-sm">
                {[
                  ["Period", r ? (r.fromDate || r.toDate ? `${fmtDate(r.fromDate)} – ${fmtDate(r.toDate)}` : "All time") : "—"],
                  ["Last sale", r ? fmtDate(r.lastSaleDate) : "—"],
                  ["Last purchase", r ? fmtDate(r.lastPurchaseDate) : "—"],
                  ["Sales transactions", r ? num(r.salesTransactions) : "—"],
                  ["Purchase transactions", r ? num(r.purchaseTransactions) : "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800">
                    <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                    <dd className="text-right font-medium tabular-nums text-slate-900 dark:text-white">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </>
      )}

      {/* History */}
      <section className={cx(card, "rp-enter relative overflow-hidden")} style={{ animationDelay: "340ms" }}>
        <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Transaction history</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Every sale and purchase for this product.</p>
          </div>
          <SlidingTabs<"sales" | "purchases">
            value={tab}
            onChange={setTab}
            options={[
              { value: "sales", label: "Sales", badge: r?.salesTransactions },
              { value: "purchases", label: "Purchases", badge: r?.purchaseTransactions },
            ]}
          />
        </div>
        <div key={tab} className="rp-fade">
          {tab === "sales" ? (
            <PagedTable
              key={`s-${historyKey}`}
              fetcher={(page, pageSize) => reportsService.getProductSalesHistory(product.id, { ...filters, page, pageSize })}
              deps={[product.id, filters.fromDate, filters.toDate]}
              rowKey={(row) => row.saleId}
              emptyTitle="No sales in this period"
              emptyDescription="This product hasn't been sold in the selected date range."
              columns={[
                { key: "id", header: "Sale", cell: (row) => <span className="font-medium tabular-nums text-slate-500 dark:text-slate-400">#{row.saleId}</span> },
                { key: "date", header: "Date", cell: (row) => <span className="text-slate-700 dark:text-slate-200">{fmtDate(row.saleDate)}</span> },
                { key: "customer", header: "Customer", cell: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.customerName}</span> },
                { key: "qty", header: "Qty", align: "right", hide: "sm", cell: (row) => <span className="tabular-nums">{num(row.quantity)}</span> },
                { key: "price", header: "Unit price", align: "right", hide: "md", cell: (row) => <span className="tabular-nums text-slate-600 dark:text-slate-300">{money(row.unitPrice)}</span> },
                { key: "total", header: "Total", align: "right", cell: (row) => <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{money(row.total)}</span> },
              ]}
            />
          ) : (
            <PagedTable
              key={`p-${historyKey}`}
              fetcher={(page, pageSize) => reportsService.getProductPurchaseHistory(product.id, { ...filters, page, pageSize })}
              deps={[product.id, filters.fromDate, filters.toDate]}
              rowKey={(row) => row.purchaseId}
              emptyTitle="No purchases in this period"
              emptyDescription="This product hasn't been purchased in the selected date range."
              columns={[
                { key: "id", header: "Purchase", cell: (row) => <span className="font-medium tabular-nums text-slate-500 dark:text-slate-400">#{row.purchaseId}</span> },
                { key: "date", header: "Date", cell: (row) => <span className="text-slate-700 dark:text-slate-200">{fmtDate(row.purchaseDate)}</span> },
                { key: "supplier", header: "Supplier", cell: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.supplierName}</span> },
                { key: "qty", header: "Qty", align: "right", hide: "sm", cell: (row) => <span className="tabular-nums">{num(row.quantity)}</span> },
                { key: "price", header: "Unit price", align: "right", hide: "md", cell: (row) => <span className="tabular-nums text-slate-600 dark:text-slate-300">{money(row.unitPrice)}</span> },
                { key: "total", header: "Total", align: "right", cell: (row) => <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{money(row.total)}</span> },
              ]}
            />
          )}
        </div>
      </section>
    </div>
  )
}

/* Tiny inline icons so this file doesn't need extra imports */
const iconProps = { className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24" } as const
function DollarIcon() {
  return <svg {...iconProps}><path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
}
function CartIcon() {
  return <svg {...iconProps}><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" /></svg>
}
function ArrowUpIcon() {
  return <svg {...iconProps}><path d="M12 19V5M5 12l7-7 7 7" /></svg>
}
function ArrowDownIcon() {
  return <svg {...iconProps}><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
}