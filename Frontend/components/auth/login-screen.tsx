"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { toast } from "sonner"
import { ApiError, apiClient } from "@/lib/api"

const CATHEDRAL_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCFjCtFcvRIDanP72siuQ0tO0mwFu2kuagC3ZVBDLcahDiCWSF5eaK3pvDxb90UFJ9y5YVbJ1hNNXwjB8vt1jLDm3m6KOM2eEu_9yK7wskJvGstdM6qMA0YdYLUqdDhiuquQt55C6Xyr-FvEqCGH1m5dFtoUdHweqcaUE-JNTcEIytrPZAszqIFHY7fMibtqK3MYzwyfq52fyf6sj3Zs7dZs3xnwXCksAdYFdGGDtEII2xhSLwhy9w3HtBX08BA5tBphX3WqQ-Hsg"

export function LoginScreen() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedIdentifier = identifier.trim()
    const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedIdentifier)
    const isPhone = /^\d{11}$/.test(trimmedIdentifier)

    if (!isEmail && !isPhone) {
      toast.error("Check your details", {
        description: "Enter a full email address or an 11-digit phone number.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await apiClient.login(trimmedIdentifier, password)

      // Signing in used to be silent: the page simply changed. Say so, by
      // name, and hold the button in its pending state through the navigation
      // so it never flicks back to "Sign In" on the way out.
      const name = res?.user?.firstName
      toast.success(name ? `Welcome back, ${name}` : "Signed in", {
        description: "Taking you to your dashboard.",
      })
      router.push("/dashboard")
    } catch (err) {
      const status = err instanceof ApiError ? err.status : -1
      const raw = err instanceof Error ? err.message : ""

      if (status === 401) {
        toast.error("Those details don't match", {
          description: "The email or phone and password combination is not recognised.",
        })
      } else if (status === 429) {
        toast.error("Too many attempts", {
          description:
            "This account is paused for a few minutes to keep it safe. Try again shortly, or reset your password.",
        })
      } else if (status === 0) {
        toast.error("Could not reach the server", {
          description: "Check your connection and try again.",
        })
      } else {
        toast.error("Sign in failed", {
          description: raw || "Something went wrong. Please try again.",
        })
      }
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-[100dvh] w-full flex-col md:h-screen md:flex-row md:overflow-hidden">
      {/* Left Panel */}
      <section
        className="hidden md:flex md:w-1/2 relative items-center justify-center p-10 overflow-hidden"
        style={{
          backgroundColor: "#0a1f44",
          backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* Blur orbs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#1E5EC8]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-20 w-96 h-96 bg-[#a5c1fe]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Cathedral image overlay */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none">
          <img src={CATHEDRAL_IMG} alt="" className="w-full h-full object-cover" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-md">
          <div className="mb-6 inline-flex items-center justify-center w-24 h-24 bg-white rounded-xl shadow-xl rotate-3 hover:rotate-0 transition-transform duration-500">
            <img src="/logo.png" alt="Dominion City" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 leading-tight tracking-tight">
            Dominion City Uyo
          </h1>
          <p className="text-base text-[#d9e2ff]/90 leading-relaxed">
            Empowering leaders to change their world through the word of God and administrative excellence.
          </p>

          {/* Bottom bar */}
          <div className="absolute bottom-8 left-10 right-10 flex justify-between items-end border-t border-white/10 pt-4">
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">Est. 1996</span>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-[#1E5EC8]" />
              <div className="w-2 h-2 rounded-full bg-white/30" />
              <div className="w-2 h-2 rounded-full bg-white/30" />
            </div>
          </div>
        </div>
      </section>

      {/* Right Panel */}
      <section className="relative flex w-full flex-1 items-center justify-center bg-[#EFF6FF] px-4 py-16 sm:px-6 md:w-1/2 md:py-6">
        {/* Mobile logo */}
        <div className="md:hidden absolute top-5 left-5 flex items-center gap-2">
          <img src="/logo.png" alt="Dominion City" className="h-7 w-auto" />
          <span className="text-lg font-bold text-[#1A3A6E]">DC Uyo</span>
        </div>

        <div className="w-full max-w-[420px] rounded-xl border border-gray-200/60 bg-white p-5 shadow-lg sm:p-8">
          <header className="mb-6">
            <h2 className="mb-1 text-2xl font-bold text-[#1A3A6E] sm:text-3xl">Welcome Back</h2>
            <p className="text-sm text-gray-500">
              Please enter your credentials to access the membership portal.
            </p>
          </header>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email / Phone */}
            <div className="space-y-1.5">
              <label htmlFor="identifier" className="block text-[11px] font-bold text-[#1A3A6E] uppercase tracking-wider">
                Email or Phone
              </label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1E5EC8] transition-colors pointer-events-none">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  id="identifier"
                  type="text"
                  placeholder="email@example.com or 08012345678"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1E5EC8] focus:ring-2 focus:ring-[#1E5EC8]/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-wider text-[#1A3A6E]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="-my-2 -mr-1 inline-flex items-center px-1 py-2 text-[11px] font-semibold text-[#1E5EC8] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1E5EC8] transition-colors pointer-events-none">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-12 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1E5EC8] focus:ring-2 focus:ring-[#1E5EC8]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-gray-400 transition-colors hover:text-[#1A3A6E]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2 py-1">
              <input
                id="remember"
                type="checkbox"
                className="h-[18px] w-[18px] shrink-0 cursor-pointer rounded border-gray-300 text-[#1E5EC8] focus:ring-[#1E5EC8]"
              />
              <label
                htmlFor="remember"
                className="flex min-h-[36px] cursor-pointer select-none items-center text-sm text-gray-500"
              >
                Keep me logged in for 30 days
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#1A3A6E] text-white rounded-lg font-semibold text-sm hover:bg-[#1A3A6E]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <LogIn className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <footer className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-[#1E5EC8] font-bold hover:underline">
                Register
              </Link>
            </p>
          </footer>
        </div>

        {/* Copyright */}
        <div className="absolute bottom-4 text-center w-full pointer-events-none">
          <p className="text-[11px] text-gray-400">© 2024 Dominion City Uyo Administrative Portal</p>
        </div>
      </section>
    </main>
  )
}
