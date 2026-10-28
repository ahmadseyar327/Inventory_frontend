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

/* ------------------------------------------------------------------ */
/* Small SVG helpers for the animated scene                            */
/* ------------------------------------------------------------------ */

interface BoxProps {
  x: number
  y: number
  w: number
  h: number
  fill: string
  stroke: string
  delay: number
}

function Box({ x, y, w, h, fill, stroke, delay }: BoxProps) {
  return (
    <g className="a-pop" style={{ animationDelay: `${delay}s` }}>
      <rect x={x} y={y} width={w} height={h} rx="4" fill={fill} stroke={stroke} strokeWidth="2" />
      <line x1={x} y1={y + h * 0.38} x2={x + w} y2={y + h * 0.38} stroke={stroke} strokeWidth="2" />
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h * 0.38} stroke={stroke} strokeWidth="2" />
    </g>
  )
}

function Sparkle({ x, y, delay, color = "#60a5fa" }: { x: number; y: number; delay: number; color?: string }) {
  return (
    <g className="a-twinkle" style={{ animationDelay: `${delay}s` }}>
      <path
        d={`M ${x} ${y - 7} L ${x + 2} ${y - 2} L ${x + 7} ${y} L ${x + 2} ${y + 2} L ${x} ${y + 7} L ${x - 2} ${y + 2} L ${x - 7} ${y} L ${x - 2} ${y - 2} Z`}
        fill={color}
      />
    </g>
  )
}

const INPUT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-blue-400 dark:focus:ring-blue-400/20 dark:[color-scheme:dark]"

const ICON_CLASS =
  "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"

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
        /* ---------- Theme tokens for the illustrated scene ---------- */
        .auth-scene {
          --floor: #c7d2fe;
          --card: #ffffff;
          --card-line: #cbd5e1;
          --ink: #1e293b;
          --muted: #cbd5e1;
          --shelf: #94a3b8;
          --shelf-back: #e2e8f0;
          --screen: #eff6ff;
          --belt: #475569;
          --skin: #f2c29b;
          --skin-shade: #e3a97c;
        }
        :is(.dark) .auth-scene {
          --floor: #020617;
          --card: #1e293b;
          --card-line: #334155;
          --ink: #e2e8f0;
          --muted: #475569;
          --shelf: #64748b;
          --shelf-back: #0f172a;
          --screen: #172554;
          --belt: #334155;
        }
        .c-floor { fill: var(--floor); opacity: 0.75; }
        .c-card { fill: var(--card); stroke: var(--card-line); }
        .c-ink { fill: var(--ink); }
        .c-muted { fill: var(--muted); }
        .c-shelf { fill: var(--shelf); }
        .c-shelf-back { fill: var(--shelf-back); opacity: 0.6; }
        .c-screen { fill: var(--screen); }
        .c-belt { fill: var(--belt); }
        .c-skin { fill: var(--skin); }
        .c-skin-shade { fill: var(--skin-shade); }

        /* ---------- Keyframes ---------- */
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes breathe {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.014); }
        }
        @keyframes headBob {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-2px) rotate(1.6deg); }
        }
        @keyframes blink {
          0%, 90%, 100% { transform: scaleY(1); }
          94% { transform: scaleY(0.08); }
        }
        @keyframes wave {
          0%, 58%, 100% { transform: rotate(0deg); }
          8% { transform: rotate(-14deg); }
          16% { transform: rotate(12deg); }
          24% { transform: rotate(-14deg); }
          32% { transform: rotate(12deg); }
          40% { transform: rotate(-14deg); }
          48% { transform: rotate(8deg); }
        }
        @keyframes tabletSway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(2.2deg); }
        }
        @keyframes drawCheck {
          0% { stroke-dashoffset: 1; }
          12%, 80% { stroke-dashoffset: 0; }
          92%, 100% { stroke-dashoffset: 1; }
        }
        @keyframes pop {
          0%, 70%, 100% { transform: translateY(0) scale(1, 1); }
          78% { transform: translateY(-6px) scale(0.97, 1.04); }
          88% { transform: translateY(0) scale(1.03, 0.96); }
          94% { transform: translateY(0) scale(1, 1); }
        }
        @keyframes bar {
          0% { transform: scaleY(0.55); }
          100% { transform: scaleY(1); }
        }
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(192px); opacity: 0; }
        }
        @keyframes ship {
          0% { transform: translateX(0); opacity: 0; }
          8% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateX(180px); opacity: 0; }
        }
        @keyframes beltDash {
          to { stroke-dashoffset: -16; }
        }
        @keyframes sway {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes twinkle {
          0%, 100% { transform: scale(0.4); opacity: 0.2; }
          50% { transform: scale(1); opacity: 1; }
        }
        @keyframes glow {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.06); opacity: 1; }
        }
        @keyframes slideFadeIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes captionIn {
          0% { opacity: 0; transform: translateY(6px); filter: blur(3px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ---------- Scene animation classes ---------- */
        .a-float   { animation: float 6s ease-in-out infinite; }
        .a-float-b { animation: float 5s ease-in-out infinite -1.5s; }
        .a-float-c { animation: float 7s ease-in-out infinite -3s; }
        .a-glow    { animation: glow 5s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        .a-breathe { animation: breathe 4s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
        .a-head    { animation: headBob 4s ease-in-out infinite; transform-origin: 201px 186px; }
        .a-blink   { animation: blink 5s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        .a-wave    { animation: wave 5s ease-in-out infinite; transform-origin: 234px 206px; }
        .a-tablet  { animation: tabletSway 3.4s ease-in-out infinite; transform-origin: 168px 206px; }
        .a-check   { stroke-dasharray: 1; stroke-dashoffset: 1; animation: drawCheck 4.5s ease-in-out infinite; }
        .a-pop     { animation: pop 6s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
        .a-bar     { animation: bar 3s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 50% 100%; }
        .a-scan    { animation: scan 3.8s ease-in-out infinite; }
        .a-ship    { animation: ship 6s linear infinite; }
        .a-belt    { stroke-dasharray: 6 10; animation: beltDash 0.53s linear infinite; }
        .a-sway    { animation: sway 4s ease-in-out infinite; transform-origin: 62px 340px; }
        .a-twinkle { animation: twinkle 3s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }

        .animate-slide-fade { animation: slideFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-caption { animation: captionIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-spin-slow { animation: spin 0.9s linear infinite; }

        /* ---------- Panel swap ---------- */
        .swap-transition {
          transition: transform 900ms cubic-bezier(0.76, 0, 0.24, 1);
          will-change: transform;
        }
        @media (min-width: 1024px) {
          main[data-mode="signup"] .char-panel { transform: translateX(100%); }
          main[data-mode="signup"] .form-panel { transform: translateX(-100%); }
        }

        /* ---------- Respect reduced motion ---------- */
        @media (prefers-reduced-motion: reduce) {
          .auth-scene *, .animate-slide-fade, .animate-caption { animation: none !important; }
          .a-check { stroke-dashoffset: 0 !important; }
          .swap-transition { transition-duration: 1ms; }
        }
      `}</style>

      <main
        data-mode={mode}
        className="relative flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
      >
        <ThemeToggle className="absolute right-5 top-5 z-30" />

        {/* Subtle dotted background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* ================= Character panel ================= */}
        <div className="swap-transition char-panel absolute inset-y-0 left-0 hidden w-1/2 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100/60 lg:flex dark:from-slate-900 dark:via-slate-950 dark:to-blue-950/50">
          {/* ambient glow blobs */}
          <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-500/15" />
          <div className="pointer-events-none absolute -bottom-28 -right-20 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/10" />

          <div className="auth-scene relative w-full max-w-lg px-8">
            <svg
              viewBox="0 0 480 420"
              className="w-full overflow-visible"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Illustration of a friendly warehouse worker checking inventory"
            >
              <defs>
                <linearGradient id="gShirt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#3b82f6" />
                  <stop offset="1" stopColor="#1d4ed8" />
                </linearGradient>
                <radialGradient id="gGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0" stopColor="#60a5fa" stopOpacity="0.5" />
                  <stop offset="0.6" stopColor="#60a5fa" stopOpacity="0.15" />
                  <stop offset="1" stopColor="#60a5fa" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="gScan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#3b82f6" stopOpacity="0" />
                  <stop offset="0.85" stopColor="#3b82f6" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#60a5fa" stopOpacity="0.9" />
                </linearGradient>
                <clipPath id="shelfClip">
                  <rect x="298" y="118" width="148" height="212" />
                </clipPath>
              </defs>

              {/* Glow + floor */}
              <circle cx="240" cy="200" r="200" fill="url(#gGlow)" className="a-glow" />
              <ellipse cx="240" cy="388" rx="220" ry="18" className="c-floor" />

              {/* Sparkles */}
              <Sparkle x={120} y={90} delay={0} />
              <Sparkle x={268} y={60} delay={1.1} color="#34d399" />
              <Sparkle x={36} y={190} delay={0.6} color="#fbbf24" />
              <Sparkle x={460} y={150} delay={1.8} />

              {/* Floating package badge (top left) */}
              <g className="a-float-c">
                <rect x="62" y="56" width="44" height="38" rx="6" fill="#60a5fa" stroke="#3b82f6" strokeWidth="2" />
                <path d="M 62 70 L 106 70" stroke="#3b82f6" strokeWidth="2" />
                <path d="M 84 56 L 84 70" stroke="#3b82f6" strokeWidth="2" />
                <circle cx="106" cy="56" r="10" fill="#10b981" />
                <path d="M 101 56 l 3.5 3.5 l 6 -6.5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>

              {/* Dashboard card (top right) */}
              <g className="a-float-b">
                <rect x="300" y="18" width="150" height="84" rx="14" className="c-card" strokeWidth="1.5" />
                <text x="314" y="40" fontSize="10" fontWeight="600" className="c-ink">Stock level</text>
                <rect x="396" y="28" width="42" height="16" rx="8" fill="#10b981" opacity="0.2" />
                <text x="417" y="39.5" fontSize="9" fontWeight="700" fill="#10b981" textAnchor="middle">+12%</text>
                {[16, 26, 20, 34, 28, 40].map((h, i) => (
                  <rect
                    key={i}
                    className="a-bar"
                    x={314 + i * 21}
                    y={92 - h}
                    width="13"
                    height={h}
                    rx="3"
                    fill={i === 5 ? "#2563eb" : "#60a5fa"}
                    style={{ animationDelay: `${i * 0.35}s` }}
                  />
                ))}
              </g>

              {/* Plant */}
              <g>
                <g className="a-sway">
                  <path d="M 62 340 C 40 320 36 290 50 270 C 64 290 68 315 62 340 Z" fill="#34d399" />
                  <path d="M 62 340 C 84 322 92 296 80 276 C 66 294 58 318 62 340 Z" fill="#10b981" />
                  <path d="M 62 340 C 56 310 58 285 62 258 C 72 285 72 312 62 340 Z" fill="#6ee7b7" />
                </g>
                <path d="M 42 338 L 82 338 L 76 378 L 48 378 Z" fill="#f59e0b" />
                <rect x="40" y="334" width="44" height="9" rx="4.5" fill="#fbbf24" />
              </g>

              {/* Shelving unit */}
              <rect x="306" y="120" width="128" height="204" rx="6" className="c-shelf-back" />
              <rect x="300" y="120" width="6" height="206" rx="3" className="c-shelf" />
              <rect x="434" y="120" width="6" height="206" rx="3" className="c-shelf" />
              <rect x="300" y="190" width="140" height="6" rx="3" className="c-shelf" />
              <rect x="300" y="255" width="140" height="6" rx="3" className="c-shelf" />
              <rect x="300" y="320" width="140" height="6" rx="3" className="c-shelf" />

              {/* Row 1 */}
              <Box x={312} y={152} w={36} h={38} fill="#60a5fa" stroke="#3b82f6" delay={0} />
              <Box x={354} y={164} w={30} h={26} fill="#fbbf24" stroke="#f59e0b" delay={0.7} />
              <Box x={390} y={148} w={36} h={42} fill="#34d399" stroke="#10b981" delay={1.4} />
              {/* Row 2 */}
              <Box x={314} y={224} w={44} h={31} fill="#fbbf24" stroke="#f59e0b" delay={2.1} />
              <Box x={366} y={212} w={28} h={43} fill="#60a5fa" stroke="#3b82f6" delay={2.8} />
              <Box x={400} y={230} w={28} h={25} fill="#34d399" stroke="#10b981" delay={3.5} />
              {/* Row 3 */}
              <Box x={312} y={282} w={30} h={38} fill="#34d399" stroke="#10b981" delay={4.2} />
              <Box x={348} y={270} w={40} h={50} fill="#60a5fa" stroke="#3b82f6" delay={4.9} />
              <Box x={394} y={290} w={34} h={30} fill="#fbbf24" stroke="#f59e0b" delay={5.6} />

              {/* Scanner beam sweeping the shelf */}
              <g clipPath="url(#shelfClip)">
                <rect className="a-scan" x="300" y="120" width="140" height="26" fill="url(#gScan)" />
              </g>

              {/* Conveyor belt */}
              <rect x="248" y="360" width="224" height="16" rx="8" className="c-belt" />
              <line x1="262" y1="368" x2="458" y2="368" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" className="a-belt" />
              <g className="a-ship">
                <rect x="262" y="330" width="34" height="30" rx="4" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
                <line x1="262" y1="340" x2="296" y2="340" stroke="#f59e0b" strokeWidth="2" />
                <line x1="279" y1="330" x2="279" y2="340" stroke="#f59e0b" strokeWidth="2" />
              </g>

              {/* ---------------- Character ---------------- */}
              <ellipse cx="201" cy="384" rx="62" ry="9" fill="#0f172a" opacity="0.18" />

              {/* Legs + shoes */}
              <rect x="181" y="290" width="19" height="82" rx="9" fill="#1e40af" />
              <rect x="203" y="290" width="19" height="82" rx="9" fill="#1e40af" />
              <path d="M 172 374 Q 172 366 186 366 L 198 366 Q 202 366 202 372 L 202 378 Q 202 381 198 381 L 176 381 Q 172 381 172 378 Z" fill="#0f172a" />
              <path d="M 230 374 Q 230 366 216 366 L 204 366 Q 200 366 200 372 L 200 378 Q 200 381 204 381 L 226 381 Q 230 381 230 378 Z" fill="#0f172a" />

              {/* Torso */}
              <g className="a-breathe">
                <rect x="166" y="188" width="70" height="114" rx="30" fill="url(#gShirt)" />
                <path d="M 187 190 L 201 208 L 215 190 Z" fill="#eff6ff" />
                <rect x="212" y="224" width="15" height="19" rx="3" fill="#ffffff" />
                <rect x="215" y="228" width="9" height="2.5" rx="1.2" fill="#3b82f6" />
                <rect x="215" y="233" width="9" height="2" rx="1" fill="#93c5fd" />
              </g>

              {/* Waving arm (viewer's right) */}
              <g className="a-wave">
                <path d="M 234 208 L 266 168" stroke="#2563eb" strokeWidth="19" strokeLinecap="round" fill="none" />
                <path d="M 266 168 L 276 148" stroke="var(--skin)" strokeWidth="12" strokeLinecap="round" fill="none" />
                <circle cx="277" cy="140" r="10.5" className="c-skin" />
                <ellipse cx="266" cy="140" rx="4" ry="6.5" transform="rotate(-25 266 140)" className="c-skin" />
              </g>

              {/* Head */}
              <g className="a-head">
                <rect x="192" y="178" width="18" height="16" rx="6" className="c-skin-shade" />
                <circle cx="167" cy="158" r="6" className="c-skin" />
                <circle cx="235" cy="158" r="6" className="c-skin" />
                <circle cx="201" cy="152" r="34" className="c-skin" />

                {/* Hard hat */}
                <path d="M 166 148 C 166 114 190 104 201 104 C 212 104 236 114 236 148 Z" fill="#fbbf24" />
                <rect x="195" y="104" width="12" height="42" rx="3" fill="#f59e0b" />
                <rect x="158" y="144" width="86" height="9" rx="4.5" fill="#f59e0b" />
                <path d="M 176 130 Q 181 118 192 113" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.45" />

                {/* Face */}
                <path d="M 183 159 Q 189 155.5 195 159" stroke="#7c4a21" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M 207 159 Q 213 155.5 219 159" stroke="#7c4a21" strokeWidth="2" strokeLinecap="round" fill="none" />
                <g className="a-blink">
                  <ellipse cx="189" cy="167" rx="3.4" ry="4.2" fill="#1e293b" />
                  <circle cx="190.2" cy="165.6" r="1.1" fill="#fff" />
                </g>
                <g className="a-blink">
                  <ellipse cx="213" cy="167" rx="3.4" ry="4.2" fill="#1e293b" />
                  <circle cx="214.2" cy="165.6" r="1.1" fill="#fff" />
                </g>
                <circle cx="179" cy="176" r="5" fill="#fb7185" opacity="0.35" />
                <circle cx="223" cy="176" r="5" fill="#fb7185" opacity="0.35" />
                <path d="M 192 177 Q 201 186 210 177" stroke="#9a3412" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              </g>

              {/* Tablet arm (viewer's left) */}
              <g className="a-tablet">
                <path d="M 168 208 Q 150 232 150 256" stroke="#2563eb" strokeWidth="19" strokeLinecap="round" fill="none" />
                <g transform="rotate(-8 131 244)">
                  <rect x="106" y="212" width="50" height="64" rx="7" fill="#0f172a" />
                  <rect x="111" y="217" width="40" height="54" rx="3" className="c-screen" />
                  {[0, 1, 2].map((i) => (
                    <g key={i}>
                      <path
                        d={`M 116 ${229 + i * 14} l 3 3 l 6 -6.5`}
                        pathLength={1}
                        stroke="#10b981"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        className="a-check"
                        style={{ animationDelay: `${i * 0.6}s` }}
                      />
                      <rect x="130" y={226 + i * 14} width={i === 1 ? 12 : 17} height="3.4" rx="1.7" className="c-muted" />
                    </g>
                  ))}
                </g>
                <circle cx="151" cy="262" r="9.5" className="c-skin" />
              </g>
            </svg>

            {/* Caption */}
            <div key={mode} className="animate-caption mt-2 text-center">
              <p className="text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                {isLogin ? "Welcome back to your workspace" : "Join thousands managing inventory smarter"}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isLogin ? "Your stock, orders and reports are ready." : "Track every item from shelf to shipment."}
              </p>
            </div>
          </div>
        </div>

        {/* ================= Form panel ================= */}
        <div className="swap-transition form-panel absolute inset-y-0 right-0 flex w-full overflow-y-auto bg-white px-6 py-8 lg:w-1/2 dark:bg-slate-900">
          {/* soft dark-mode glow behind the form */}
          <div className="pointer-events-none absolute inset-0 hidden dark:block">
            <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />
          </div>

          <div className="relative m-auto w-full max-w-sm">
            {/* Logo */}
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="rounded-xl bg-blue-50 p-1.5 ring-1 ring-blue-100 dark:bg-white/10 dark:ring-white/10">
                <img src={appLogo} alt="" className="h-10 w-10 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Inventory MIS</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Smart inventory management</p>
              </div>
            </div>

            {/* Title area */}
            <div key={mode} className="animate-slide-fade mb-5 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isLogin ? "Sign in to your account" : "Create your account"}
              </h2>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                {isLogin
                  ? "Enter your credentials to access your dashboard"
                  : "Get started with your free account today"}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="relative mb-5 grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/80">
              <div
                className="swap-transition absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-md bg-white shadow-sm dark:bg-slate-700 dark:shadow-black/30"
                style={{ transform: isLogin ? "translateX(0)" : "translateX(100%)" }}
              />
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`relative z-10 rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
                  isLogin
                    ? "text-blue-600 dark:text-blue-300"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`relative z-10 rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
                  !isLogin
                    ? "text-blue-600 dark:text-blue-300"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Alerts */}
            {error && (
              <div
                role="alert"
                className="animate-slide-fade mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
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
                className="animate-slide-fade mb-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-2.5 text-xs text-green-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
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
                <label htmlFor="username" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Username
                </label>
                <div className="relative">
                  <svg className={ICON_CLASS} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Password
                </label>
                <div className="relative">
                  <svg className={ICON_CLASS} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
                    className={INPUT_CLASS}
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
                aria-hidden={isLogin}
              >
                <div className="overflow-hidden">
                  <div className="pt-0.5">
                    <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Confirm password
                    </label>
                    <div className="relative">
                      <svg className={ICON_CLASS} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:focus:ring-blue-400"
                    />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                    Forgot password?
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition-all duration-200 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-500/30 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:shadow-blue-500/30 dark:hover:bg-blue-400 dark:focus:ring-blue-400/30"
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
            <p className="mt-5 text-center text-xs text-slate-400 dark:text-slate-500">
              Protected by enterprise-grade security
            </p>
          </div>
        </div>
      </main>
    </>
  )
}