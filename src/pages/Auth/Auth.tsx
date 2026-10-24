import { useState, type FormEvent } from "react"
import axios from "axios"
import appLogo from "../../assets/logo.png"
import ThemeToggle from "../../components/ThemeToggle/ThemeToggle"
import { authService } from "./Auth.service"
import type { AuthResponse } from "../../types/auth.types"
import { useToast } from "../../contexts/useToast"

interface AuthProps {
  onAuthenticated: (response: AuthResponse) => void
}

type AuthMode = "login" | "signup"

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.title ??
      error.message ??
      "Something went wrong."
    )
  }
  return "Something went wrong. Please try again."
}

export default function Auth({ onAuthenticated }: AuthProps) {
  const { showToast } = useToast()
  const [mode, setMode] = useState<AuthMode>("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (!username.trim() || !password) {
      const message = "Please enter your username and password."
      setError(message)
      showToast({ title: "Sign-in details required", message, variant: "warning" })
      return
    }

    if (mode === "signup" && password !== confirmPassword) {
      const message = "Passwords do not match."
      setError(message)
      showToast({ title: "Passwords do not match", message, variant: "warning" })
      return
    }

    setLoading(true)

    try {
      if (mode === "login") {
        const response = await authService.login({
          username: username.trim(),
          password,
        })
        showToast({ title: "Signed in", message: "Welcome back.", variant: "success" })
        onAuthenticated(response)
      } else {
        await authService.register({
          username: username.trim(),
          password,
        })
        setSuccess("Account created! Please sign in to continue.")
        showToast({
          title: "Account created",
          message: "Your account is ready. Please sign in to continue.",
          variant: "success",
        })
        setMode("login")
        setPassword("")
        setConfirmPassword("")
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err)
      setError(message)
      showToast({
        title: mode === "login" ? "Sign-in failed" : "Account creation failed",
        message,
        variant: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  function switchMode(nextMode: AuthMode) {
    if (nextMode === mode) return
    setMode(nextMode)
    setError("")
    setSuccess("")
  }

  const isLogin = mode === "login"

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes checkBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes armMove {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-15deg); }
        }
        @keyframes boxFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(2deg); }
        }
        @keyframes slideFadeIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-check { animation: checkBounce 2s ease-in-out infinite; }
        .animate-arm { animation: armMove 2s ease-in-out infinite; transform-origin: top center; }
        .animate-box { animation: boxFloat 2.5s ease-in-out infinite; }
        .animate-box-delay { animation: boxFloat 2.5s ease-in-out infinite 0.5s; }
        .animate-slide-fade { animation: slideFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-spin-slow { animation: spin 0.9s linear infinite; }
        .animate-breathe { animation: breathe 4s ease-in-out infinite; }
        
        .swap-transition {
          transition: transform 900ms cubic-bezier(0.76, 0, 0.24, 1);
          will-change: transform;
        }
      `}</style>

      <main className="relative flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <ThemeToggle className="absolute right-5 top-5 z-30" />
        {/* Subtle background pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #2563eb 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Character panel - left in login, right in signup */}
        <div
          className="swap-transition absolute inset-y-0 left-0 flex w-1/2 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100/40 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900"
          style={{
            transform: isLogin ? "translateX(0)" : "translateX(100%)",
          }}
        >
          <div className="relative w-full max-w-md px-8">
            <div className="animate-float relative">
              <svg
                viewBox="0 0 400 400"
                className="w-full animate-breathe"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Background circle */}
                <circle cx="200" cy="200" r="180" fill="#dbeafe" opacity="0.5" />
                
                {/* Floor */}
                <ellipse cx="200" cy="340" rx="150" ry="20" fill="#e0e7ff" opacity="0.6" />
                
                {/* Person - Head */}
                <circle cx="200" cy="120" r="35" fill="#fbbf24" />
                {/* Hair */}
                <path d="M 165 110 Q 165 85 200 85 Q 235 85 235 110" fill="#92400e" />
                {/* Eyes */}
                <circle cx="190" cy="115" r="3" fill="#1e293b" />
                <circle cx="210" cy="115" r="3" fill="#1e293b" />
                {/* Smile */}
                <path d="M 185 130 Q 200 138 215 130" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
                
                {/* Body */}
                <rect x="175" y="155" width="50" height="70" rx="8" fill="#2563eb" />
                {/* Tie */}
                <path d="M 200 155 L 195 175 L 200 195 L 205 175 Z" fill="#1e40af" />
                
                {/* Left arm (holding clipboard) */}
                <g className="animate-arm">
                  <rect x="145" y="165" width="30" height="12" rx="6" fill="#fbbf24" />
                  {/* Clipboard */}
                  <rect x="115" y="170" width="35" height="45" rx="3" fill="#f3f4f6" stroke="#94a3b8" strokeWidth="2" />
                  <rect x="120" y="180" width="25" height="3" rx="1" fill="#cbd5e1" />
                  <rect x="120" y="188" width="25" height="3" rx="1" fill="#cbd5e1" />
                  <rect x="120" y="196" width="25" height="3" rx="1" fill="#cbd5e1" />
                  {/* Checkmarks */}
                  <g className="animate-check">
                    <path d="M 122 182 L 125 185 L 130 178" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </g>
                  <g className="animate-check" style={{ animationDelay: '0.3s' }}>
                    <path d="M 122 190 L 125 193 L 130 186" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </g>
                </g>
                
                {/* Right arm */}
                <rect x="225" y="165" width="30" height="12" rx="6" fill="#fbbf24" />
                
                {/* Legs */}
                <rect x="180" y="225" width="15" height="50" rx="7" fill="#1e40af" />
                <rect x="205" y="225" width="15" height="50" rx="7" fill="#1e40af" />
                {/* Shoes */}
                <ellipse cx="187" cy="275" rx="12" ry="6" fill="#1e293b" />
                <ellipse cx="212" cy="275" rx="12" ry="6" fill="#1e293b" />
                
                {/* Inventory boxes */}
                <g className="animate-box">
                  <rect x="280" y="260" width="50" height="50" rx="4" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
                  <line x1="280" y1="275" x2="330" y2="275" stroke="#f59e0b" strokeWidth="2" />
                  <line x1="305" y1="260" x2="305" y2="310" stroke="#f59e0b" strokeWidth="2" />
                </g>
                
                <g className="animate-box-delay">
                  <rect x="290" y="210" width="45" height="45" rx="4" fill="#60a5fa" stroke="#3b82f6" strokeWidth="2" />
                  <line x1="290" y1="225" x2="335" y2="225" stroke="#3b82f6" strokeWidth="2" />
                  <line x1="312" y1="210" x2="312" y2="255" stroke="#3b82f6" strokeWidth="2" />
                </g>
                
                <g className="animate-box" style={{ animationDelay: '1s' }}>
                  <rect x="70" y="270" width="45" height="45" rx="4" fill="#34d399" stroke="#10b981" strokeWidth="2" />
                  <line x1="70" y1="285" x2="115" y2="285" stroke="#10b981" strokeWidth="2" />
                  <line x1="92" y1="270" x2="92" y2="315" stroke="#10b981" strokeWidth="2" />
                </g>
                
                {/* Floating data points */}
                <circle cx="100" cy="150" r="4" fill="#3b82f6" opacity="0.6" className="animate-float" />
                <circle cx="320" cy="160" r="3" fill="#10b981" opacity="0.6" className="animate-float" style={{ animationDelay: '0.5s' }} />
                <circle cx="340" cy="130" r="5" fill="#f59e0b" opacity="0.6" className="animate-float" style={{ animationDelay: '1s' }} />
              </svg>
            </div>

            {/* Caption under character */}
            <div className="mt-4 text-center">
              <p className="text-sm font-medium text-slate-600">
                {isLogin ? "Welcome back to your workspace" : "Join thousands managing inventory smarter"}
              </p>
            </div>
          </div>
        </div>

        {/* Form panel - right in login, left in signup */}
        <div
          className="swap-transition absolute inset-y-0 right-0 flex w-1/2 items-center justify-center bg-white px-6 dark:bg-slate-900"
          style={{
            transform: isLogin ? "translateX(0)" : "translateX(-100%)",
          }}
        >
          <div className="w-full max-w-sm">
            {/* Logo */}
            <div className="mb-6 flex items-center justify-center gap-3">
              <img
                src={appLogo}
                alt=""
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Inventory MIS</h1>
                <p className="text-xs text-slate-500">Smart inventory management</p>
              </div>
            </div>

            {/* Title area with fade transition */}
            <div key={mode} className="animate-slide-fade mb-5 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {isLogin ? "Sign in to your account" : "Create your account"}
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                {isLogin
                  ? "Enter your credentials to access your dashboard"
                  : "Get started with your free account today"}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="relative mb-5 grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
              <div
                className="swap-transition absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md bg-white shadow-sm"
                style={{
                  left: isLogin ? "4px" : "calc(50%)",
                }}
              />
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`relative z-10 rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
                  isLogin ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`relative z-10 rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
                  !isLogin ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Alerts */}
            {error && (
              <div
                role="alert"
                className="animate-slide-fade mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700"
              >
                <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div
                role="status"
                className="animate-slide-fade mb-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-2.5 text-xs text-green-700"
              >
                <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="username" className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Username
                </label>
                <div className="relative">
                  <svg
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    id="username"
                    name="username"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Enter your username"
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <svg
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Confirm password - smooth expand/collapse */}
              <div
                className="grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  gridTemplateRows: !isLogin ? "1fr" : "0fr",
                  opacity: !isLogin ? 1 : 0,
                }}
              >
                <div className="overflow-hidden">
                  <div className="pt-0.5">
                    <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Confirm password
                    </label>
                    <div className="relative">
                      <svg
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Re-enter your password"
                        required={!isLogin}
                        tabIndex={!isLogin ? 0 : -1}
                        className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-1.5 text-slate-600">
                    <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition-all duration-200 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-500/30 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin-slow h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                        <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      <span>Please wait...</span>
                    </>
                  ) : (
                    <>
                      <span>{isLogin ? "Sign in" : "Create account"}</span>
                      <svg
                        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Footer */}
            <p className="mt-5 text-center text-xs text-slate-400">
              Protected by enterprise-grade security
            </p>
          </div>
        </div>
      </main>
    </>
  )
}