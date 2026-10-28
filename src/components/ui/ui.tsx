import { useEffect, useState, type ReactNode } from "react"
import {
  AlertCircle,
  ChevronRight,
  Inbox,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react"

/* ------------------------------------------------------------------ */
/* Tokens                                                              */
/* ------------------------------------------------------------------ */

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ")

export const card =
  "rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_32px_-18px_rgba(15,23,42,0.14)] dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-none"

export const inputBase =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-blue-400 dark:focus:ring-blue-400/20 dark:disabled:bg-slate-800/30 dark:disabled:text-slate-400 dark:[color-scheme:dark]"

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_8px_18px_-8px_rgba(37,99,235,0.7)] transition-all hover:from-blue-500 hover:to-blue-700 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"

export const btnGhost =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-400/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800"

export const btnDanger =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-b from-rose-500 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_18px_-8px_rgba(225,29,72,0.7)] transition-all hover:from-rose-500 hover:to-rose-700 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/30 disabled:cursor-not-allowed disabled:opacity-60"

export const th = "px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400"

export type Tone = "blue" | "emerald" | "amber" | "rose" | "violet" | "slate"

const toneIcon: Record<Tone, string> = {
  blue: "bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20",
  emerald: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  amber: "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
  rose: "bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/20",
  violet: "bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20",
  slate: "bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/20",
}

const tonePill: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-700 ring-blue-600/15 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/25",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25",
  rose: "bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/25",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/25",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/15 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600/50",
}

const toneDot: Record<Tone, string> = {
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  slate: "bg-slate-400",
}

export const toneBar: Record<Tone, string> = {
  blue: "bg-gradient-to-r from-blue-500 to-cyan-400",
  emerald: "bg-gradient-to-r from-emerald-500 to-teal-400",
  amber: "bg-gradient-to-r from-amber-500 to-orange-400",
  rose: "bg-gradient-to-r from-rose-500 to-pink-400",
  violet: "bg-gradient-to-r from-violet-500 to-purple-400",
  slate: "bg-slate-400",
}

/* ------------------------------------------------------------------ */
/* Motion helpers                                                      */
/* ------------------------------------------------------------------ */

export function UiStyles() {
  return (
    <style>{`
      @keyframes ui-fade { from { opacity: 0 } to { opacity: 1 } }
      @keyframes ui-pop { from { opacity: 0; transform: translateY(14px) scale(.97) } to { opacity: 1; transform: none } }
      @keyframes ui-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
      @keyframes ui-draw { to { stroke-dashoffset: 0 } }
      @keyframes ui-grow { from { transform: scaleY(0) } to { transform: scaleY(1) } }
      @keyframes ui-sweep { from { stroke-dasharray: 0 1000 } }
      .ui-fade { animation: ui-fade .2s ease both }
      .ui-pop { animation: ui-pop .3s cubic-bezier(.16,1,.3,1) both }
      .ui-rise { animation: ui-rise .55s cubic-bezier(.16,1,.3,1) both }
      .ui-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: ui-draw 1.4s cubic-bezier(.65,0,.35,1) .1s forwards }
      .ui-grow { transform-box: fill-box; transform-origin: 50% 100%; animation: ui-grow .9s cubic-bezier(.16,1,.3,1) both }
      @media (prefers-reduced-motion: reduce) {
        .ui-fade, .ui-pop, .ui-rise, .ui-grow { animation: none }
        .ui-draw { animation: none; stroke-dashoffset: 0 }
      }
    `}</style>
  )
}

export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const reduced =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const total = reduced ? 1 : duration
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / total)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

export function PageShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="relative">
      <UiStyles />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-500/[0.07] via-blue-500/[0.02] to-transparent dark:from-blue-500/[0.12] dark:via-blue-500/[0.03]" />
      <div className={cx("relative mx-auto px-4 py-8 sm:px-6 lg:py-10", wide ? "max-w-7xl" : "max-w-6xl")}>
        {children}
      </div>
    </div>
  )
}

export function PageHeader({
  crumbs,
  title,
  subtitle,
  action,
}: {
  crumbs: string[]
  title: string
  subtitle: string
  action?: ReactNode
}) {
  return (
    <header className="ui-rise mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          {crumbs.map((c, i) => (
            <span key={c} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 opacity-60" />}
              <span className={i === crumbs.length - 1 ? "font-semibold text-blue-600 dark:text-blue-400" : ""}>{c}</span>
            </span>
          ))}
        </nav>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-1.5 max-w-xl text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      {action}
    </header>
  )
}

export function StatCard({
  label,
  value,
  icon,
  tone = "blue",
  hint,
  index = 0,
}: {
  label: string
  value: number
  icon: ReactNode
  tone?: Tone
  hint?: string
  index?: number
}) {
  const shown = useCountUp(value)
  return (
    <div
      className={cx(
        card,
        "ui-rise group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgba(37,99,235,0.35)] dark:hover:border-slate-700",
      )}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">
            {shown.toLocaleString()}
          </p>
        </div>
        <span className={cx("flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset transition-transform duration-300 group-hover:scale-110", toneIcon[tone])}>
          {icon}
        </span>
      </div>
      {hint && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

const avatarGradients = [
  "from-blue-500 to-indigo-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
]

export function Avatar({ name, size = "md", icon }: { name: string; size?: "md" | "lg"; icon?: ReactNode }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  const gradient = avatarGradients[hash % avatarGradients.length]
  return (
    <span
      className={cx(
        "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-semibold text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10",
        gradient,
        size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm",
      )}
    >
      {icon ?? initials}
    </span>
  )
}

export function Pill({ tone = "slate", dot = true, children }: { tone?: Tone; dot?: boolean; children: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", tonePill[tone])}>
      {dot && <span className={cx("h-1.5 w-1.5 rounded-full", toneDot[tone])} />}
      {children}
    </span>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  className?: string
}) {
  return (
    <div className={cx("relative", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cx(inputBase, "pl-10 pr-9")}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-slate-200 text-slate-500 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; icon?: ReactNode }[]
}) {
  return (
    <div role="tablist" className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
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
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
              active
                ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-300"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
            )}
          >
            {o.icon}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function RowActions({ onEdit, onDelete, label }: { onEdit: () => void; onDelete: () => void; label: string }) {
  const base =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
  return (
    <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
      <button type="button" onClick={onEdit} title={`Edit ${label}`} aria-label={`Edit ${label}`} className={cx(base, "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-400/10 dark:hover:text-blue-300")}>
        <Pencil className="h-4 w-4" />
      </button>
      <button type="button" onClick={onDelete} title={`Delete ${label}`} aria-label={`Delete ${label}`} className={cx(base, "hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-400/10 dark:hover:text-rose-300")}>
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

export function Field({
  label,
  required,
  hint,
  htmlFor,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700">
        {icon ?? <Inbox className="h-6 w-6" />}
      </span>
      <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-[55vh] items-center justify-center p-4">
      <div className={cx(card, "ui-pop w-full max-w-md p-8 text-center")}>
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-1 ring-inset ring-rose-200 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/20">
          <AlertCircle className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Something went wrong</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{message}</p>
        <button type="button" onClick={onRetry ?? (() => window.location.reload())} className={cx(btnPrimary, "mt-6")}>
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      </div>
    </div>
  )
}

export function PageSkeleton({ stats = 3, rows = 6 }: { stats?: number; rows?: number }) {
  const bar = "animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-800"
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading">
      <div className="space-y-3">
        <div className={cx(bar, "h-3 w-40")} />
        <div className={cx(bar, "h-9 w-64")} />
        <div className={cx(bar, "h-4 w-80 max-w-full")} />
      </div>
      <div className={cx("grid gap-4", stats === 4 ? "grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-3")}>
        {Array.from({ length: stats }).map((_, i) => (
          <div key={i} className={cx(bar, "h-28")} />
        ))}
      </div>
      <div className={cx(card, "space-y-3 p-5")}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={cx(bar, "h-12")} />
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Modal + confirm                                                     */
/* ------------------------------------------------------------------ */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  iconTone = "blue",
  size = "md",
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  icon?: ReactNode
  iconTone?: Tone
  size?: "sm" | "md"
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-99999 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="ui-fade absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cx(
          "ui-pop relative w-full overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:rounded-3xl",
          size === "sm" ? "max-w-sm" : "max-w-md",
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
          <div className="flex items-center gap-3.5">
            {icon && (
              <span className={cx("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset", toneIcon[iconTone])}>
                {icon}
              </span>
            )}
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
              {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 pb-6 pt-2">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} icon={<Trash2 className="h-5 w-5" />} iconTone="rose" size="sm">
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{message}</p>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={onCancel} disabled={busy} className={cx(btnGhost, "flex-1")}>
          Cancel
        </button>
        <button type="button" onClick={onConfirm} disabled={busy} className={cx(btnDanger, "flex-1")}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? "Deleting..." : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}