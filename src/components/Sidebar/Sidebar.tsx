import { useState, useRef, useEffect, type ReactNode } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import appLogo from "../../assets/logo.png"
import ThemeToggle from "../ThemeToggle/ThemeToggle"

// ============================================================================
// 1. TYPES & CONFIGURATION (All in one file)
// ============================================================================

export interface SubNavItem {
  label: string
  href: string
  badge?: string
}

export interface NavItem {
  label: string
  href?: string
  icon: ReactNode
  children?: SubNavItem[]
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export interface ERPSidebarProps {
  brandName?: string
  pageTitle?: string
  sections?: NavSection[]
  onLogout: () => void
  children: ReactNode
}

// Professional ERP Navigation Configuration
export const erpSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: (
          <>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </>
        ),
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Products",
        href: "/products",
        icon: (
          <>
            <path d="M16.5 9.4 7.55 4.24" />
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </>
        )
      },
      {
        label: "Customers",
        href: "/customers",
        icon: (
          <>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </>
        )
      },
      {
        label: "Suppliers",
        href: "/suppliers",
        icon: (
         <>
            <path d="m11 17 2 2a1 1 0 1 0 3-3" />
            <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
            <path d="m21 3 1 11h-2" />
            <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
            <path d="M3 4h8" />
          </>
        )
      },
      {
        label: "Sales",
        href: "/sale",
        icon: (
          <>
            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
            <path d="M8 7h8" />
            <path d="M8 11h8" />
            <path d="M8 15h5" />
          </>
        )
      },
      {
        label: "Purchases",
        href: "/purchase",
        icon: (
          <>
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </>
        )
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        label: "Reports",
        icon: (
          <>
            <path d="M3 3v18h18" />
            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
          </>
        ),
        children: [
          { label: "Finance Reports", href: "/finance-reports" },
          { label: "Inventory Reports", href: "/inventory-reports" },
        ],
      },
      {
        label: "Settings",
        href: "/settings",
        icon: (
          <>
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </>
        ),
      },
      {
        label: "Users",
        href: "/users",
        icon: (
          <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="10" cy="7" r="4" />
          </>
        ),
      },
    ],
  },
]

// ============================================================================
// 2. HELPER COMPONENTS
// ============================================================================

function Icon({ children, className = "h-5 w-5" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  )
}

// ============================================================================
// 3. MAIN ERP SIDEBAR COMPONENT
// ============================================================================

export default function Sidebar({
  brandName = "Inventory MIS",
  pageTitle = "Dashboard",
  sections = erpSections,
  onLogout,
  children,
}: ERPSidebarProps) {
  const navigate = useNavigate();
  const [isPinned, setIsPinned] = useState(true)
  const [isHovering, setIsHovering] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [openParents, setOpenParents] = useState<string[]>([])
  const sidebarRef = useRef<HTMLElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const { pathname: currentPath } = useLocation()

  const isExpanded = isPinned || isHovering

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMobileOpen(false)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    sections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children?.some((child) => isActive(child.href))) {
          setOpenParents((current) =>
            current.includes(item.label) ? current : [...current, item.label]
          )
        }
      })
    })
  }, [currentPath, sections])

  useEffect(() => {
    if (!isProfileMenuOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !profileMenuRef.current?.contains(event.target)
      ) {
        setIsProfileMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsProfileMenuOpen(false)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isProfileMenuOpen])

  function isActive(href?: string) {
    if (!href) return false
    return currentPath === href || currentPath.startsWith(href + "/")
  }

  function isParentActive(item: NavItem) {
    if (item.href && isActive(item.href)) return true
    return item.children?.some((child) => isActive(child.href)) || false
  }

  function toggleParent(label: string) {
    setOpenParents((current) =>
      current.includes(label)
        ? current.filter((openLabel) => openLabel !== label)
        : [...current, label]
    )
  }

  const SidebarContent = (
    <aside
      ref={sidebarRef}
      onMouseEnter={() => !isPinned && setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false)
        setHoveredItem(null)
      }}
      className={`
        flex h-full flex-col border-r border-slate-200 bg-white text-slate-700 
        transition-all duration-300 ease-in-out overflow-hidden z-50
        ${isExpanded ? "w-[280px]" : "w-[76px]"}
      `}
    >
      {/* Header / Brand */}
      <div className="flex h-22 shrink-0 items-center border-b border-slate-100 px-4">
        <Link to="/dashboard" className="flex items-center gap-3 min-w-0" onClick={() => setIsMobileOpen(false)}>
          <img
            src={appLogo}
            alt=""
            className="h-10 w-10 shrink-0 object-contain"
          />

          <div
            className={`flex flex-col min-w-0 transition-all duration-300 ${
              isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
            }`}
          >
            <span className="text-sm font-bold text-slate-900 truncate">{brandName}</span>
            <span className="text-[11px] text-slate-500 font-medium">Enterprise Workspace</span>
          </div>
        </Link>
      </div>

      {/* Navigation Area */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
        {sections.map((section) => (
          <div key={section.title}>
            <h3
              className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 transition-all duration-300 ${
                isExpanded ? "opacity-100 h-5" : "opacity-0 h-0 overflow-hidden"
              }`}
            >
              {section.title}
            </h3>

            <ul className="space-y-1">
              {section.items.map((item) => {
                const hasChildren = !!item.children && item.children.length > 0
                const parentActive = isParentActive(item)
                const parentOpen = openParents.includes(item.label)
                const isHovered = hoveredItem === item.label

                return (
                  <li key={item.label} className="relative">
                    <div
                      onMouseEnter={() => !isExpanded && hasChildren && setHoveredItem(item.label)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <Link
                        to={hasChildren ? currentPath : item.href ?? currentPath}
                        onClick={(event) => {
                          if (hasChildren) {
                            event.preventDefault()
                            toggleParent(item.label)
                          }
                          setIsMobileOpen(false)
                        }}
                        className={`
                          group flex items-center rounded-lg text-sm font-medium transition-all duration-200 relative
                          ${isExpanded ? "px-3 py-2.5" : "justify-center p-2.5"}
                          ${
                            parentActive
                              ? "bg-blue-50 text-blue-700"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }
                        `}
                      >
                        {/* Active Indicator Line (ERP Style) */}
                        {parentActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full" />
                        )}

                        <Icon
                          className={`h-5 w-5 shrink-0 ${
                            parentActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                          }`}
                        >
                          {item.icon}
                        </Icon>

                        <span
                          className={`ml-3 truncate transition-all duration-300 ${
                            isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
                          }`}
                        >
                          {item.label}
                        </span>

                        {hasChildren && isExpanded && (
                          <Icon className={`ml-auto h-4 w-4 text-slate-400 transition-transform duration-200 ${parentOpen ? "rotate-90" : ""}`}>
                            <path d="m9 18 6-6-6-6" />
                          </Icon>
                        )}
                      </Link>

                      {/* Expanded Submenu (Inline Dropdown) */}
                      {hasChildren && isExpanded && parentOpen && (
                        <ul className="mt-1 ml-4 space-y-1 border-l border-slate-200 pl-3">
                          {item.children!.map((child) => (
                            <li key={child.href}>
                              <Link
                                to={child.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={`flex items-center justify-between px-3 py-1.5 text-[13px] rounded-md transition-colors ${
                                  isActive(child.href)
                                    ? "text-blue-700 font-semibold"
                                    : "text-slate-500 hover:text-slate-900"
                                }`}
                              >
                                <span>{child.label}</span>
                                {child.badge && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-blue-100 text-blue-700 rounded">
                                    {child.badge}
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Collapsed Flyout Submenu (Tooltip) */}
                    {hasChildren && !isExpanded && isHovered && (
                      <div className="absolute left-full top-0 ml-3 w-56 bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-50 animate-flyout">
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100 mb-1">
                          {item.label}
                        </div>
                        <ul className="space-y-0.5">
                          {item.children!.map((child) => (
                            <li key={child.href}>
                              <Link
                                to={child.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={`flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                                  isActive(child.href)
                                    ? "bg-blue-50 text-blue-700 font-semibold"
                                    : "text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                <span>{child.label}</span>
                                {child.badge && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-blue-100 text-blue-700 rounded">
                                    {child.badge}
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer / Pin & Profile */}
      <div className="shrink-0 border-t border-slate-100 p-3 space-y-2">
        {/* Pin Toggle */}
        <button
          onClick={() => setIsPinned(!isPinned)}
          className={`
            w-full flex items-center rounded-lg text-sm font-medium transition-all
            ${
              isExpanded
                ? "px-3 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                : "justify-center p-2.5 text-slate-400 hover:bg-slate-50 hover:text-slate-900"
            }
          `}
          title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
        >
          <Icon className="h-5 w-5">
            {isPinned ? (
              <>
                <line x1="12" y1="17" x2="12" y2="22" />
                <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
              </>
            ) : (
              <>
                <line x1="2" y1="2" x2="22" y2="22" />
                <line x1="12" y1="17" x2="12" y2="22" />
                <path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h12" />
                <path d="M15 9.34V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0-1.33 3.49" />
              </>
            )}
          </Icon>
          <span
            className={`ml-3 transition-all duration-300 ${
              isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
            }`}
          >
            {isPinned ? "Unpin Sidebar" : "Pin Sidebar"}
          </span>
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex relative">
      <style>{`
        @keyframes flyout {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes route-enter {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-flyout { animation: flyout 0.2s ease-out forwards; }
        .route-enter { animation: route-enter 0.18s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .route-enter { animation: none; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}</style>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block sticky top-0 h-screen">
        {SidebarContent}
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:hidden
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {SidebarContent}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm shadow-slate-900/[0.02] backdrop-blur-md sm:px-6 lg:h-[72px] lg:px-8 dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={isMobileOpen}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <Icon className="h-5 w-5">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </Icon>
            </button>
            <div className="min-w-0">
              <div className="hidden items-center gap-2 text-xs font-medium text-slate-400 sm:flex">
                <span>{brandName}</span>
                <span aria-hidden="true">/</span>
                <span className="truncate text-slate-500 dark:text-slate-400">
                  {pageTitle}
                </span>
              </div>
              <h1 className="truncate text-base font-semibold tracking-tight text-slate-900 sm:mt-0.5 sm:text-lg dark:text-white">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle
              showLabel={false}
              className="h-10 w-10 justify-center !gap-0 !p-0"
            />
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((open) => !open)}
                aria-label="Open profile menu"
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:bg-slate-700 dark:hover:text-blue-300"
              >
                <Icon className="h-5 w-5">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20a7 7 0 0 1 14 0" />
                </Icon>
              </button>

              {isProfileMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900"
                >
                  {/* User Info Header */}
                  <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Admin User
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Account profile
                    </p>
                  </div>

                  {/* View Profile Button */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsProfileMenuOpen(false)
                      navigate('/profile')
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:bg-blue-50 dark:text-slate-300 dark:hover:bg-blue-950/40 dark:hover:text-blue-300 dark:focus:bg-blue-950/40"
                  >
                    <Icon className="h-4 w-4">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </Icon>
                    View Profile
                  </button>

                  {/* Sign Out Button */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsProfileMenuOpen(false)
                      onLogout()
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:bg-red-50 dark:text-slate-300 dark:hover:bg-red-950/40 dark:hover:text-red-300 dark:focus:bg-red-950/40"
                  >
                    <Icon className="h-4 w-4">
                      <path d="M10 17l5-5-5-5" />
                      <path d="M15 12H3" />
                      <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
                    </Icon>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="route-enter flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}