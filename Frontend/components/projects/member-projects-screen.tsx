"use client"

import { useEffect, useState } from "react"
import { HandCoins } from "lucide-react"
import { apiClient } from "@/lib/api"
import { GiveModal } from "@/components/giving/give-modal"

const naira = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(
    value || 0
  )

export function MemberProjectsScreen() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const uploadsBaseUrl = apiBaseUrl.replace(/\/api$/, "")

  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
      .getProjects()
      .then((res) => setProjects((res.projects || []).filter((p: any) => p.status !== "archived")))
      .catch(() => setProjects([]))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1A3A6E] sm:text-2xl">Ongoing Projects</h1>
        <p className="text-sm text-gray-500">Support the projects our church is building.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl border border-gray-100 bg-white" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400">No ongoing projects right now.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => {
            const cover = resolveImageUrl(project.imageUrl)
            const raised = Number(project.totalRaised || 0)
            const target = Number(project.targetAmount || 0)
            const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : null
            return (
              <div
                key={project.id}
                className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
              >
                <div className="h-36 bg-[#1A3A6E]/10">
                  {cover ? (
                    <img src={cover} alt={project.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <HandCoins className="h-8 w-8 text-[#1A3A6E]/25" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{project.title}</h3>
                  {project.description && (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">{project.description}</p>
                  )}

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#1A3A6E]">{naira(raised)} raised</span>
                      {target > 0 && <span className="text-gray-400">of {naira(target)}</span>}
                    </div>
                    {pct !== null && (
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-[#1E5EC8]" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                    <p className="mt-1 text-[11px] text-gray-400">{project.contributorCount || 0} givers</p>
                  </div>

                  <button
                    onClick={() => setGiveTarget(project)}
                    className="mt-4 w-full rounded-full bg-[#1E5EC8] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1A3A6E]"
                  >
                    Give to Support
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
          await apiClient.giveToProject(giveTarget.id, data)
        }}
      />
    </div>
  )
}
