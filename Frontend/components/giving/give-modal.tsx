"use client"

import { useState } from "react"
import { X, Loader2 } from "lucide-react"

interface GiveModalProps {
  open: boolean
  onClose: () => void
  sourceTitle: string
  actionLabel?: string
  onSubmit: (data: { amount: number; isAnonymous: boolean; note?: string }) => Promise<void>
}

/**
 * Manual-payment give modal. The member enters an amount, optionally gives
 * anonymously, and clicks "I've Paid" — creating a pending contribution the
 * admin later confirms.
 */
export function GiveModal({ open, onClose, sourceTitle, actionLabel = "I've Paid", onSubmit }: GiveModalProps) {
  const [amount, setAmount] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (!open) return null

  const reset = () => {
    setAmount("")
    setIsAnonymous(false)
    setNote("")
    setError(null)
    setDone(false)
  }

  const close = () => {
    reset()
    onClose()
  }

  const submit = async () => {
    const value = Number(amount)
    if (Number.isNaN(value) || value <= 0) {
      setError("Please enter a valid amount.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({ amount: value, isAnonymous, note: note || undefined })
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
      <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-[#0A1F44]">Give to Support</h3>
            <p className="text-[11px] text-gray-400">{sourceTitle}</p>
          </div>
          <button onClick={close} className="rounded-lg p-1.5 transition-colors hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              ✓
            </div>
            <p className="text-sm font-semibold text-gray-800">Thank you!</p>
            <p className="text-xs leading-relaxed text-gray-500">
              Your giving has been recorded and is awaiting confirmation by an admin.
            </p>
            <button
              onClick={close}
              className="mt-2 rounded-full bg-[#1E5EC8] px-8 py-2 text-sm font-semibold text-white hover:bg-[#1A3A6E]"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4 px-5 py-5">
            <div>
              <label className="text-xs font-semibold text-gray-600">Amount (₦)</label>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Note (optional)</label>
              <input
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
                placeholder="Reference or message"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              Give anonymously
            </label>

            <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-700">
              Payment is manual. After you have paid, tap "{actionLabel}" and an admin will confirm your giving.
            </p>

            {error && <p className="text-xs font-medium text-red-500">{error}</p>}

            <button
              onClick={submit}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1E5EC8] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1A3A6E] disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {actionLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
