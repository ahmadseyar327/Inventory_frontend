import React, { useState, useEffect } from "react"
import { userService } from "../Users/Users.service"
import type { UserResponseDTO, UpdateUserDTO } from "../../types/user.type"
import { useNavigate } from "react-router"
import { useToast } from "../../contexts/useToast"
import { clearAuthToken } from "../../services/api"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  Hash,
  Loader2,
  Lock,
  Save,
  Shield,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react"
import Sidebar from "../../components/Sidebar/Sidebar"
import { ErrorState, Field, PageShell, UiStyles, btnGhost, btnPrimary, card, cx, inputBase } from "../../components/ui/ui"

/** 0–4 score for the strength meter. */
function passwordScore(value: string): number {
  if (!value) return 0
  let score = 0
  if (value.length >= 8) score++
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++
  if (/\d/.test(value)) score++
  if (/[^A-Za-z0-9]/.test(value)) score++
  return score
}

const strengthMeta = [
  { label: "Too weak", bar: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" },
  { label: "Weak", bar: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" },
  { label: "Fair", bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  { label: "Good", bar: "bg-blue-500", text: "text-blue-600 dark:text-blue-400" },
  { label: "Strong", bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
]

export default function ProfilePage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [user, setUser] = useState<UserResponseDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const data = await userService.getMyProfile()
        setUser(data)
        setUsername(data.username)
        setError(null)
      } catch (err) {
        setError("Failed to load profile. Please try again later.")
        console.error("Profile fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Client-side validation before API call
    if (password.length > 0 && password.length < 8) {
      setSaveError("Password must be at least 8 characters long.")
      return
    }

    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const updateData: UpdateUserDTO = {
        id: user.id,
        username: username,
        password: password || "",
      }

      const updatedUser = await userService.updateMyProfile(updateData)
      setUser(updatedUser)
      setIsEditing(false)
      setPassword("")
      setShowPassword(false)
      setSaveSuccess(true)
      showToast({ title: "Success", message: "Profile updated successfully!", variant: "success" })

      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError("Failed to update profile. Please check your inputs.")
      console.error("Profile update error:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    clearAuthToken()
    showToast({ title: "Signed out", message: "You have been securely signed out.", variant: "success" })
    navigate("/login", { replace: true })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setUsername(user?.username || "")
    setPassword("")
    setShowPassword(false)
    setSaveError(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
        <PageShell>
          <div className="space-y-6" aria-busy="true" aria-label="Loading profile">
            <div className="h-56 animate-pulse rounded-3xl bg-slate-200/80 dark:bg-slate-800" />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="h-64 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800" />
              <div className="h-64 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800 lg:col-span-2" />
            </div>
          </div>
        </PageShell>
      </Sidebar>
    )
  }

  if (error || !user) {
    return (
      <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
        <ErrorState message={error || "User data not found."} />
      </Sidebar>
    )
  }

  const score = passwordScore(password)
  const strength = strengthMeta[score]
  const fieldLocked = !isEditing

  return (
    <Sidebar brandName="Inventory MIS" onLogout={handleLogout}>
      <UiStyles />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
        {/* Hero */}
        <section className={cx(card, "ui-rise overflow-hidden")}>
          <div className="relative h-36 overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 sm:h-44">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,.55) 1px, transparent 0)",
                backgroundSize: "22px 22px",
              }}
            />
            <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
            <div className="absolute -bottom-20 left-1/3 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl" />
          </div>

          <div className="relative px-6 pb-6 sm:px-8">
            <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="relative w-fit">
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-4xl font-semibold text-white shadow-xl ring-4 ring-white dark:ring-slate-900 sm:h-28 sm:w-28">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  {user.isAdmin && (
                    <span className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow ring-4 ring-white dark:ring-slate-900" title="Administrator">
                      <Shield className="h-4 w-4" />
                    </span>
                  )}
                </div>
                <div className="pb-1">
                  <h1 className="break-words text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{user.username}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={cx(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                        user.isActive
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25"
                          : "bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/25",
                      )}
                    >
                      {user.isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                    {user.isAdmin && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25">
                        <Shield className="h-3.5 w-3.5" /> Administrator
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="h-3.5 w-3.5" /> Member since {formatDate(user.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {!isEditing && (
                <button type="button" onClick={() => setIsEditing(true)} className={btnPrimary}>
                  <Edit3 className="h-4 w-4" /> Edit profile
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Account info */}
          <aside className="ui-rise space-y-4 lg:col-span-1" style={{ animationDelay: "90ms" }}>
            {[
              { label: "Role", icon: <ShieldCheck className="h-4 w-4" />, value: <span className="capitalize">{user.roleName}</span> },
              { label: "Account ID", icon: <Hash className="h-4 w-4" />, value: <span className="tabular-nums">#{user.id}</span> },
              {
                label: "Account status",
                icon: user.isActive ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />,
                value: user.isActive ? "Active" : "Inactive",
              },
            ].map((item) => (
              <div key={item.label} className={cx(card, "flex items-center gap-4 p-4")}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-500/20 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20">
                  {item.icon}
                </span>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.value}</p>
                </div>
              </div>
            ))}
          </aside>

          {/* Form */}
          <section className={cx(card, "ui-rise overflow-hidden lg:col-span-2")} style={{ animationDelay: "160ms" }}>
            <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-800">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" /> Account details
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {isEditing ? "Make your changes, then save." : "Select “Edit profile” to change your details."}
                </p>
              </div>
            </div>

            <div className="p-6">
              {saveSuccess && (
                <div role="status" className="ui-pop mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <CheckCircle2 className="h-5 w-5 shrink-0" /> Profile updated successfully!
                </div>
              )}
              {saveError && (
                <div role="alert" className="ui-pop mb-5 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm font-medium text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                  <AlertCircle className="h-5 w-5 shrink-0" /> {saveError}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-5">
                <Field label="Username" htmlFor="username">
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={fieldLocked}
                      className={cx(inputBase, "pl-10")}
                      placeholder="Enter your username"
                    />
                  </div>
                </Field>

                <Field label="New password" htmlFor="password" hint={isEditing && password.length === 0 ? "Leave blank to keep your current password." : undefined}>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={fieldLocked}
                      autoComplete="new-password"
                      className={cx(inputBase, "pl-10 pr-11")}
                      placeholder={isEditing ? "Enter new password" : "••••••••"}
                    />
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                  </div>

                  {isEditing && password.length > 0 && (
                    <div className="mt-3" aria-live="polite">
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map((step) => (
                          <span
                            key={step}
                            className={cx("h-1.5 flex-1 rounded-full transition-all duration-300", step <= score ? strength.bar : "bg-slate-200 dark:bg-slate-700")}
                          />
                        ))}
                      </div>
                      <p className={cx("mt-1.5 flex items-center gap-1.5 text-xs font-medium", strength.text)}>
                        {password.length >= 8 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                        {password.length >= 8 ? `${strength.label} password` : "Use at least 8 characters"}
                      </p>
                    </div>
                  )}
                </Field>

                {isEditing && (
                  <div className="flex flex-col-reverse gap-3 border-t border-slate-200/80 pt-5 dark:border-slate-800 sm:flex-row sm:items-center">
                    <button type="submit" disabled={isSaving || !username.trim()} className={cx(btnPrimary, "sm:min-w-[160px]")}>
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {isSaving ? "Saving..." : "Save changes"}
                    </button>
                    <button type="button" onClick={handleCancel} disabled={isSaving} className={btnGhost}>
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          </section>
        </div>
      </div>
    </Sidebar>
  )
}