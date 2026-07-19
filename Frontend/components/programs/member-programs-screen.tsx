"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, MapPin } from "lucide-react"
import { apiClient } from "@/lib/api"
import { GiveModal } from "@/components/giving/give-modal"

const naira = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(
    value || 0
  )

export function MemberProgramsScreen() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const uploadsBaseUrl = apiBaseUrl.replace(/\/api$/, "")

  const [programs, setPrograms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [tab, setTab] = useState<"national" | "state">("national")
  const [giveTarget, setGiveTarget] = useState<any | null>(null)

  const resolveImageUrl = (value: string | null | undefined) => {
    if (!value) return null
    if (value.startsWith("http")) return value
    if (value.startsWith("/uploads/")) return `${uploadsBaseUrl}${value}`
    if (value.startsWith("uploads/")) return `${uploadsBaseUrl}/${value}`
    if (!value.includes("/")) return `${uploadsBaseUrl}/uploads/${value}`
    return value
  }

  useEffect(() => {
    apiClient
      .getPrograms()
      .then((res) => setPrograms(res.programs || []))
      .catch(() => setPrograms([]))
      .finally(() => setIsLoading(false))
  }, [])

  const list = useMemo(() => programs.filter((p) => p.scope === tab), [programs, tab])

  return (
    <div className="space-y-6 pb-28">
      <div>
        <h1 className="text-2xl font-bold text-[#1A3A6E]">Programs</h1>
        <p className="text-sm text-gray-500">National and state programs across the church.</p>
      </div>

      <div className="flex gap-2">
        {(["national", "state"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition-colors ${
              tab === s ? "bg-[#1E5EC8] text-white" : "bg-white text-gray-500 border border-gray-100"
            }`}
          >
            {s} Programs
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl border border-gray-100 bg-white" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400">No {tab} programs right now.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((program) => {
            const cover = resolveImageUrl(program.imageUrl)
            return (
              <div
                key={program.id}
                className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
              >
                <div className="h-36 bg-[#1A3A6E]/10">
                  {cover ? (
                    <img src={cover} alt={program.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <CalendarDays className="h-8 w-8 text-[#1A3A6E]/25" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{program.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                    {program.startDate && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(program.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    {program.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {program.location}
                      </span>
                    )}
                  </div>
                  {program.description && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500">{program.description}</p>
                  )}
                  <p className="mt-2 text-[11px] font-semibold text-[#1A3A6E]">
                    {naira(Number(program.totalRaised || 0))} raised · {program.contributorCount || 0} givers
                  </p>
                  <button
                    onClick={() => setGiveTarget(program)}
                    className="mt-4 w-full rounded-full bg-[#1E5EC8] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1A3A6E]"
                  >
                    Support Program
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <GiveModal
        open={!!giveTarget}
        onClose={() => setGiveTarget(null)}
        sourceTitle={giveTarget?.title || ""}
        onSubmit={async (data) => {
          await apiClient.giveToProgram(giveTarget.id, data)
        }}
      />
    </div>
  )
}
