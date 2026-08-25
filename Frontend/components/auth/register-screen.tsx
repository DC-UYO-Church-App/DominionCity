"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const SANCTUARY_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAnCZv4E7BFSOBjNjklE61zhfhXrdT7W5w8vMGXsV69GbjzDC2-yYLV0HkwIsS3prXCSUxsaybU2ESiDmOy1F84xNKB3K4NxG0R_W8wPiDRGq3u0Elh1RN7cDGXuJyOcgYZNjm8Hswzp9c04F502-NmtG2k6GWX1YDKVppPxr5DyGbhDftFD3qM_Ku9_PKSQ6MnrxG9JtTiQ7TbjMjxNnAk0LgZZV-wUnt00TemnNVDrSda0iVZkTSpiMeRTKCQAMBrS6DAHIp0qA"

const inputClass =
  "w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#415e94] focus:ring-2 focus:ring-[#415e94]/20 transition-all placeholder:text-gray-300"

const labelClass = "block text-[11px] font-bold text-[#0a1f44] uppercase tracking-wider mb-1.5"

export function RegisterScreen() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    address: "",
  })
  const [agreed, setAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const set = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Registration error", description: "Passwords do not match.", variant: "destructive" })
      return
    }
    if (!agreed) {
      toast({ title: "Registration error", description: "Please accept the Terms of Service.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      await apiClient.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim() || "Member",
        phoneNumber: formData.phone,
        dateOfBirth: formData.dateOfBirth || undefined,
        address: formData.address || undefined,
      })
      router.push("/dashboard")
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Registration failed"
      const message = raw === "Request failed" ? "Unable to register. Check your details and try again." : raw
      toast({ title: "Registration failed", description: message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* Left Panel */}
      <section className="relative flex w-full items-center justify-center overflow-hidden bg-[#0a1f44] md:h-auto md:w-5/12">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img src={SANCTUARY_IMG} alt="" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1f44] via-[#0a1f44]/40 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 px-6 py-10 text-center sm:px-10 md:text-left">
          <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-[#34466d] p-3 shadow-xl sm:p-4 md:mb-6">
            <img src="/logo.png" alt="Dominion City" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:mb-4 md:text-5xl">
            Dominion City Uyo
          </h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-[#7687b2] sm:text-base md:mx-0">
            Raising leaders that transform society. Join our community and experience a life of dignity and purpose.
          </p>

          {/* Glass pill */}
          <div className="hidden md:flex mt-8 items-center gap-3 max-w-xs bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-[#415e94] animate-pulse flex-shrink-0" />
            <span className="text-white text-[11px] font-bold uppercase tracking-widest">
              A Place for Spiritual Growth
            </span>
          </div>
        </div>
      </section>

      {/* Right Panel */}
      <section className="flex w-full items-center justify-center bg-[#fbf8fc] px-4 py-8 sm:px-6 md:w-7/12 md:p-10">
        <div className="w-full max-w-2xl rounded-xl border border-gray-200/50 bg-white p-5 shadow-lg sm:p-8 md:p-10">
          <header className="mb-8">
            <h2 className="mb-1 text-2xl font-bold text-[#00081e] sm:text-3xl">Create Account</h2>
            <p className="text-sm text-gray-500">
              Fill in the details below to register as a member of Dominion City Uyo.
            </p>
          </header>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="firstName" className={labelClass}>First Name</label>
                <input id="firstName" type="text" placeholder="John" required value={formData.firstName} onChange={set("firstName")} className={inputClass} />
              </div>
              <div>
                <label htmlFor="lastName" className={labelClass}>Last Name</label>
                <input id="lastName" type="text" placeholder="Doe" required value={formData.lastName} onChange={set("lastName")} className={inputClass} />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="email" className={labelClass}>Email Address</label>
                <input id="email" type="email" placeholder="john.doe@example.com" required value={formData.email} onChange={set("email")} className={inputClass} />
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>Phone Number</label>
                <input id="phone" type="tel" placeholder="+234 800 000 0000" required value={formData.phone} onChange={set("phone")} className={inputClass} />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="password" className={labelClass}>Password</label>
                <input id="password" type="password" placeholder="••••••••" required value={formData.password} onChange={set("password")} className={inputClass} />
              </div>
              <div>
                <label htmlFor="confirmPassword" className={labelClass}>Confirm Password</label>
                <input id="confirmPassword" type="password" placeholder="••••••••" required value={formData.confirmPassword} onChange={set("confirmPassword")} className={inputClass} />
              </div>
            </div>

            {/* DOB & Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="dateOfBirth" className={labelClass}>Date of Birth</label>
                <input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={set("dateOfBirth")} className={inputClass} />
              </div>
              <div>
                <label htmlFor="address" className={labelClass}>Full Address</label>
                <input id="address" type="text" placeholder="123 Faith Street, Uyo" value={formData.address} onChange={set("address")} className={inputClass} />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer rounded border-gray-300 text-[#415e94] focus:ring-[#415e94]"
              />
              <label htmlFor="terms" className="text-sm text-gray-500 cursor-pointer select-none leading-relaxed">
                I agree to the{" "}
                <span className="text-[#415e94] font-semibold hover:underline cursor-pointer">Terms of Service</span>{" "}
                and{" "}
                <span className="text-[#415e94] font-semibold hover:underline cursor-pointer">Privacy Policy</span>.
              </label>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#0a1f44] text-white rounded-xl font-semibold text-base hover:bg-[#0a1f44]/90 active:scale-[0.98] transition-all shadow-lg shadow-[#0a1f44]/20 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>

            <footer className="text-center pt-1">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/login" className="text-[#415e94] font-bold hover:underline">
                  Sign In
                </Link>
              </p>
            </footer>
          </form>
        </div>
      </section>
    </main>
  )
}
