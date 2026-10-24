import { createContext, useCallback, useMemo, useState, type ReactNode } from "react"

export type ToastVariant = "success" | "error" | "info" | "warning"

export interface ToastItem {
  id: number
  title: string
  message?: string
  variant: ToastVariant
  duration?: number
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id">) => void
  dismissToast: (id: number) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

const variantStyles: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-100",
  error: "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/70 dark:text-red-100",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-100",
  info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/70 dark:text-blue-100",
}

const iconColors: Record<ToastVariant, string> = {
  success: "bg-emerald-500",
  error: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
}

function ToastViewport({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  if (!toasts.length) return null

  return (
    <div className="pointer-events-none fixed bottom-5 left-5 z-[9999] flex w-[min(100vw-2rem,26rem)] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-animate pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-[0_20px_45px_-18px_rgba(15,23,42,0.55)] backdrop-blur-sm ${variantStyles[toast.variant]}`}
          role="status"
          aria-live="polite"
        >
          <span className={`mt-0.5 h-2.5 w-2.5 rounded-full ${iconColors[toast.variant]}`} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-5">{toast.title}</p>
            {toast.message && <p className="mt-1 text-sm/5 text-current/80">{toast.message}</p>}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="ml-2 rounded-full p-1 text-current/70 transition hover:bg-black/5 hover:text-current dark:hover:bg-white/10"
            aria-label="Dismiss notification"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.random()
    const duration = toast.duration ?? 4000

    setToasts((current) => [...current, { ...toast, id, duration }])

    window.setTimeout(() => dismissToast(id), duration)
  }, [dismissToast])

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}
