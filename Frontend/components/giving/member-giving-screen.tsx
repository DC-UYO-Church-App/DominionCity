"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { HandCoins, FolderKanban, CalendarDays } from "lucide-react"
import { apiClient } from "@/lib/api"

const naira = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(
    value || 0
  )

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600",
  confirmed: "bg-emerald-50 text-emerald-600",
  rejected: "bg-red-50 text-red-500",
}

export function MemberGivingScreen() {
  const [contributions, setContributions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiClient
      .getMyContributions()
      .then((res) => setContributions(res.contributions || []))
      .catch(() => setContributions([]))
      .finally(() => setIsLoading(false))
  }, [])

  const totals = useMemo(() => {
    let confirmed = 0
    let pending = 0
    contributions.forEach((c) => {
      if (c.status === "confirmed") confirmed += Number(c.amount || 0)
      if (c.status === "pending") pending += Number(c.amount || 0)
    })
    return { confirmed, pending }
  }, [contributions])

  return (
    <div className="space-y-6 pb-28">
      <div>
        <h1 className="text-2xl font-bold text-[#1A3A6E]">My Giving</h1>
        <p className="text-sm text-gray-500">Your contributions to projects and programs.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Total Given</p>
          <p className="mt-1 text-lg font-bold text-emerald-600">{naira(totals.confirmed)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Awaiting Confirmation</p>
          <p className="mt-1 text-lg font-bold text-amber-600">{naira(totals.pending)}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href="/dashboard/projects"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white py-3 text-sm font-semibold text-[#1A3A6E] shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:bg-gray-50"
        >
          <FolderKanban className="h-4 w-4" /> Projects
        </Link>
        <Link
          href="/dashboard/programs"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white py-3 text-sm font-semibold text-[#1A3A6E] shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:bg-gray-50"
        >
          <CalendarDays className="h-4 w-4" /> Programs
        </Link>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold text-[#1A3A6E]">History</h2>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-gray-100 bg-white" />
            ))}
          </div>
        ) : contributions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <HandCoins className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">You haven't given yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            {contributions.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{c.sourceTitle || c.sourceType}</p>
                  <p className="text-xs text-gray-400">
                    {c.sourceType} · {new Date(c.createdAt).toLocaleDateString()}
                    {c.isAnonymous ? " · anonymous" : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-bold text-gray-900">{naira(Number(c.amount))}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                      statusStyles[c.status] || "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
