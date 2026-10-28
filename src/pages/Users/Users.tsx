import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router"
import { Users, UserCheck, UserX, Shield, Loader2 } from "lucide-react"
import Sidebar from "../../components/Sidebar/Sidebar"
import { useToast } from "../../contexts/useToast"
import { clearAuthToken } from "../../services/api"
import { userService } from "./Users.service" // Adjust path as needed
import type { UserResponseDTO, AdminUpdateDTO } from "../../types/user.type" // Adjust path as needed
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Modal,
  PageHeader,
  PageShell,
  PageSkeleton,
  Pill,
  RowActions,
  SearchInput,
  Segmented,
  StatCard,
  btnGhost,
  btnPrimary,
  card,
  cx,
  inputBase,
  th,
  type Tone,
} from "../../components/ui/ui"

type ViewMode = "table" | "gallery"

function emptyForm(): AdminUpdateDTO {
  return { id: 0, roleName: "User", isActive: true }
}

function roleTone(roleName: string): Tone {
  const role = roleName.toLowerCase()
  if (role.includes("admin")) return "violet"
  if (role.includes("manager")) return "amber"
  return "slate"
}

export default function UsersPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [users, setUsers] = useState<UserResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("table")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<AdminUpdateDTO>(emptyForm())
  const [submitting, setSubmitting] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<UserResponseDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch Users on Mount
  useEffect(() => {
    let isMounted = true
    async function fetchUsers() {
      try {
        const data = await userService.getAll()
        if (isMounted) setUsers(data)
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to load users"
          setError(message)
          showToast({ title: "Error", message, variant: "error" })
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void fetchUsers()
    return () => {
      isMounted = false
    }
  }, [showToast])

  // Delete Handler
  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await userService.delete(pendingDelete.id)
      setUsers((prev) => prev.filter((u) => u.id !== pendingDelete.id))
      showToast({ title: "Deleted", message: "The user was removed successfully.", variant: "success" })
      setPendingDelete(null)
    } catch (err: unknown) {
      showToast({ title: "Delete failed", message: err instanceof Error ? err.message : "Failed to delete user", variant: "error" })
    } finally {
      setDeleting(false)
    }
  }

  // Update Handler (Admin Update)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return

    setSubmitting(true)
    try {
      const updated = await userService.adminUpdate({ ...formData, id: editingId })
      setUsers((prev) => prev.map((u) => (u.id === editingId ? updated : u)))
      showToast({ title: "Updated", message: `${updated.username}'s account was updated.`, variant: "success" })
      closeModal()
    } catch (err: unknown) {
      showToast({ title: "Error", message: err instanceof Error ? err.message : "Operation failed", variant: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  function openEditModal(user: UserResponseDTO) {
    setIsEditMode(true)
    setEditingId(user.id)
    setFormData({
      id: user.id,
      roleName: user.roleName,
      isActive: user.isActive,
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingId(null)
    setIsEditMode(false)
    setFormData(emptyForm())
  }

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return users.filter(
      (u) => u.username.toLowerCase().includes(term) || u.roleName.toLowerCase().includes(term)
    )
  }, [users, searchTerm])

  const activeCount = users.filter((u) => u.isActive).length
  const inactiveCount = users.filter((u) => !u.isActive).length
  const adminCount = users.filter((u) => u.isAdmin).length

  const handleLogout = () => {
    clearAuthToken()
    showToast({ title: "Signed out", message: "You have been securely signed out.", variant: "success" })
    navigate("/login", { replace: true })
  }

  // Loading State
  if (loading) {
    return (
      <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
        <PageShell>
          <PageSkeleton stats={4} rows={6} />
        </PageShell>
      </Sidebar>
    )
  }

  // Error State
  if (error) {
    return (
      <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
        <ErrorState message={error} />
      </Sidebar>
    )
  }

  const noMatches = (
    <EmptyState
      title="No users match your search"
      description={`Nothing found for “${searchTerm}”. Try a different name or role.`}
      action={
        <button type="button" className={btnGhost} onClick={() => setSearchTerm("")}>
          Clear search
        </button>
      }
    />
  )

  const noUsers = (
    <EmptyState
      icon={<Users className="h-6 w-6" />}
      title="No users found"
      description="There are currently no user accounts in the system."
    />
  )

  return (
    <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
      <PageShell>
        <PageHeader
          crumbs={["Workspace", "Administration", "Users"]}
          title="Users"
          subtitle="Manage user accounts, roles, and access permissions."
        />

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard index={0} label="Total Users" value={users.length} tone="blue" icon={<Users className="h-5 w-5" />} hint="Registered accounts" />
          <StatCard index={1} label="Active" value={activeCount} tone="emerald" icon={<UserCheck className="h-5 w-5" />} hint="Currently active" />
          <StatCard index={2} label="Inactive" value={inactiveCount} tone="rose" icon={<UserX className="h-5 w-5" />} hint="Disabled accounts" />
          <StatCard index={3} label="Administrators" value={adminCount} tone="violet" icon={<Shield className="h-5 w-5" />} hint="With admin privileges" />
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Segmented<ViewMode>
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: "table", label: "Table", icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg> },
              { value: "gallery", label: "Gallery", icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> },
            ]}
          />
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search by name or role" className="w-full sm:w-72" />
        </div>

        {/* Table View */}
        {viewMode === "table" && (
          <div className={cx(card, "ui-rise overflow-hidden")} style={{ animationDelay: "200ms" }}>
            {users.length === 0 ? (
              noUsers
            ) : filtered.length === 0 ? (
              noMatches
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/30">
                    <tr>
                      <th className={th}>User</th>
                      <th className={cx(th, "hidden sm:table-cell")}>Role</th>
                      <th className={th}>Status</th>
                      <th className={cx(th, "hidden md:table-cell")}>Joined</th>
                      <th className={cx(th, "text-right")}>
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {filtered.map((user, i) => (
                      <tr
                        key={user.id}
                        className="ui-rise group transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-400/[0.06]"
                        style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-500/20 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20 font-semibold">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-white">{user.username}</span>
                              <p className="text-xs text-slate-500 dark:text-slate-400">ID: {user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-5 py-3.5 sm:table-cell">
                          <Pill tone={roleTone(user.roleName)} dot={user.isAdmin}>
                            {user.roleName}
                          </Pill>
                        </td>
                        <td className="px-5 py-3.5">
                          <Pill tone={user.isActive ? "emerald" : "rose"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Pill>
                        </td>
                        <td className="hidden px-5 py-3.5 md:table-cell">
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <RowActions label={user.username} onEdit={() => openEditModal(user)} onDelete={() => setPendingDelete(user)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Gallery View */}
        {viewMode === "gallery" &&
          (users.length === 0 ? (
            <div className={card}>{noUsers}</div>
          ) : filtered.length === 0 ? (
            <div className={card}>{noMatches}</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((user, i) => (
                <div
                  key={user.id}
                  className={cx(
                    card,
                    "ui-rise group relative p-5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_18px_40px_-20px_rgba(37,99,235,0.4)] dark:hover:border-blue-500/50",
                  )}
                  style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-500/20 transition-transform duration-300 group-hover:scale-110 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20 font-semibold text-lg">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                    <RowActions label={user.username} onEdit={() => openEditModal(user)} onDelete={() => setPendingDelete(user)} />
                  </div>
                  <h3 className="truncate font-semibold text-slate-900 dark:text-white">{user.username}</h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">ID: {user.id}</p>
                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Role</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.roleName}</p>
                    </div>
                    <Pill tone={user.isActive ? "emerald" : "rose"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Pill>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </div>
                </div>
              ))}
            </div>
          ))}

        {/* Footer Meta */}
        <p className="mt-5 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
          {filtered.length} user{filtered.length !== 1 ? "s" : ""} shown
        </p>

        {/* Edit User Modal */}
        <Modal
          open={isModalOpen}
          onClose={closeModal}
          title="Edit user account"
          subtitle="Update the user's role and status below."
          icon={<Users className="h-5 w-5" />}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Username" htmlFor="u-name">
              <input 
                id="u-name" 
                type="text" 
                disabled 
                value={users.find(u => u.id === editingId)?.username || ""} 
                className={cx(inputBase, "cursor-not-allowed opacity-70")} 
              />
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Username is managed by the user or system.</p>
            </Field>
            
            <Field label="Role" required htmlFor="u-role">
              <select 
                id="u-role" 
                value={formData.roleName} 
                onChange={(e) => setFormData({ ...formData, roleName: e.target.value })} 
                className={inputBase}
              >
                <option value="Employee">Employee</option>
                <option value="Admin">Admin</option>
              </select>
            </Field>

            <Field label="Account Status" required htmlFor="u-status">
              <select 
                id="u-status" 
                value={formData.isActive ? "active" : "inactive"} 
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "active" })} 
                className={inputBase}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>

            <div className="flex gap-3 border-t border-slate-200/80 pt-5 dark:border-slate-800">
              <button type="button" onClick={closeModal} className={cx(btnGhost, "flex-1")}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} className={cx(btnPrimary, "flex-1")}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={pendingDelete !== null}
          title="Delete user?"
          message={
            <>
              The account for <span className="font-semibold text-slate-900 dark:text-white">{pendingDelete?.username}</span> will be permanently removed. This action cannot be undone.
            </>
          }
          busy={deleting}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setPendingDelete(null)}
        />
      </PageShell>
    </Sidebar>
  )
}