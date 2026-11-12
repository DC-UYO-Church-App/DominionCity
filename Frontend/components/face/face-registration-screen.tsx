"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle, ChevronRight, Loader2, ScanFace, ShieldCheck, Trash2 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import { FaceCapture } from "./face-capture"

type Enrollment = {
  userId: string
  detScore: number | null
  consentAt: string
  updatedAt: string
} | null

export function FaceRegistrationScreen() {
  const [enrollment, setEnrollment] = useState<Enrollment>(null)
  const [configured, setConfigured] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [mode, setMode] = useState<"idle" | "capture" | "review">("idle")
  const [captured, setCaptured] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const load = () =>
    apiClient
      .getMyFaceEnrollment()
      .then((r) => {
        setEnrollment(r.enrollment || null)
        setConfigured(r.configured !== false)
      })
      .catch(() => setEnrollment(null))
      .finally(() => setIsLoading(false))

  useEffect(() => {
    load()
  }, [])

  const reset = () => {
    setCaptured(null)
    setConsent(false)
    setMode("idle")
  }

  const submit = async () => {
    if (!captured || !consent) return
    setIsSubmitting(true)
    try {
      await apiClient.enrollMyFace(captured, consent)
      toast.success("Face registered", {
        description: "Your face is now on file for recognition.",
      })
      reset()
      setIsLoading(true)
      await load()
    } catch (error) {
      toast.error("Could not register your face", {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const remove = async () => {
    try {
      await apiClient.deleteMyFaceEnrollment()
      toast.success("Face registration removed")
      setEnrollment(null)
    } catch (error) {
      toast.error("Could not remove your registration", {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
        <Link href="/dashboard" className="transition-colors hover:text-[#1A3A6E]">
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[#1A3A6E]">Face ID</span>
      </nav>

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#a5c1fe]/30">
          <ScanFace className="h-5 w-5 text-[#415e94]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#0a1f44]">Face ID</h1>
          <p className="text-xs text-gray-500">
            Register your face so the church can recognise you at check-in.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center">
          <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-gray-300" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      ) : !configured ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          Face registration isn't available yet. Please check back later.
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white p-5 sm:p-6">
          {/* Current status */}
          {enrollment && mode === "idle" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <CheckCircle className="h-6 w-6 flex-shrink-0 text-emerald-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-900">Your face is registered</p>
                  <p className="text-xs text-emerald-700">
                    Last updated{" "}
                    {new Date(enrollment.updatedAt).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMode("capture")}
                  className="rounded-lg bg-[#1A3A6E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a1f44]"
                >
                  Re-register
                </button>
                <button
                  type="button"
                  onClick={remove}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </div>
          ) : mode === "idle" ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-gray-600">
                You haven't registered your face yet.
              </p>
              <button
                type="button"
                onClick={() => setMode("capture")}
                className="rounded-lg bg-[#1A3A6E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0a1f44]"
              >
                Start face registration
              </button>
            </div>
          ) : null}

          {/* Capture */}
          {mode === "capture" && (
            <div className="space-y-4">
              <FaceCapture
                captureLabel="Capture my face"
                onCapture={(dataUrl) => {
                  setCaptured(dataUrl)
                  setMode("review")
                }}
              />
              <button
                type="button"
                onClick={reset}
                className="mx-auto block text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Review + consent */}
          {mode === "review" && captured && (
            <div className="space-y-4">
              <div className="mx-auto aspect-[4/3] w-full max-w-sm overflow-hidden rounded-xl bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={captured} alt="Captured face" className="h-full w-full scale-x-[-1] object-cover" />
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4"
                />
                <span className="flex items-start gap-2 text-xs text-gray-600">
                  <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#415e94]" />
                  I consent to Dominion City storing my facial data to recognise me. I can remove
                  it at any time from this page.
                </span>
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={submit}
                  disabled={!consent || isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1A3A6E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0a1f44] disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Registering..." : "Register this face"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCaptured(null)
                    setMode("capture")
                  }}
                  className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Retake
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
