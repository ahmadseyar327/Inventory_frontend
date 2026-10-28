import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"
import { ChevronRight, Tags } from "lucide-react"
import Sidebar from "../../components/Sidebar/Sidebar"
import { useToast } from "../../contexts/useToast"
import { clearAuthToken } from "../../services/api"
import { productTypeService } from "../ProductTypes/ProductTypes.service"
import { PageHeader, PageShell, Pill, card, cx } from "../../components/ui/ui"

export default function SettingsPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [typeCount, setTypeCount] = useState<number | null>(null)

  // Only used for the little count badge, so a failure is silently ignored.
  useEffect(() => {
    let isMounted = true
    productTypeService
      .getAll()
      .then((types : any) => {
        if (isMounted) setTypeCount(types.length)
      })
      .catch(() => {
        if (isMounted) setTypeCount(null)
      })
    return () => {
      isMounted = false
    }
  }, [])

  const handleLogout = () => {
    clearAuthToken()
    showToast({ title: "Signed out", message: "You have been securely signed out.", variant: "success" })
    navigate("/login", { replace: true })
  }

  return (
    <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
      <PageShell>
        <PageHeader
          crumbs={["Workspace", "Settings"]}
          title="Settings"
          subtitle="Configure how your inventory is organised."
        />

        <section aria-labelledby="inventory-settings">
          <h2 id="inventory-settings" className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
            Inventory
          </h2>

          <Link
            to="/product-types"
            className={cx(
              card,
              "ui-rise group flex items-center gap-4 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_18px_40px_-20px_rgba(37,99,235,0.4)] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 dark:hover:border-blue-500/50 sm:p-6",
            )}
            style={{ animationDelay: "80ms" }}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-500/20 transition-transform duration-300 group-hover:scale-110 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20">
              <Tags className="h-6 w-6" />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Product types</h3>
                {typeCount !== null && (
                  <Pill tone="blue" dot={false}>
                    {typeCount} {typeCount === 1 ? "type" : "types"}
                  </Pill>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Create and manage the types your products are grouped into, like Electronics or Clothing.
              </p>
            </div>

            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-blue-600 dark:group-hover:text-blue-300" />
          </Link>
        </section>
      </PageShell>
    </Sidebar>
  )
}