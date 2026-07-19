"use client"

import { useEffect, useState } from "react"
import { Church, MapPin, ArrowRight } from "lucide-react"
import { apiClient } from "@/lib/api"

export function MemberSatelliteScreen() {
  const [churches, setChurches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiClient
      .getMySatelliteChurches()
      .then((res) => setChurches(res.satelliteChurches || []))
      .catch(() => setChurches([]))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="space-y-6 pb-28">
      <div>
        <h1 className="text-2xl font-bold text-[#1A3A6E]">My Satellite Churches</h1>
        <p className="text-sm text-gray-500">Satellite churches assigned to you.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-gray-100 bg-white" />
          ))}
        </div>
      ) : churches.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <Church className="h-9 w-9 text-gray-300" />
          <p className="text-sm text-gray-400">No satellite church has been assigned to you.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {churches.map((church) => (
            <div
              key={church.id}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1A3A6E]/10">
                  <Church className="h-6 w-6 text-[#1A3A6E]" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{church.name}</p>
                  {church.location && (
                    <p className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="h-3 w-3" /> {church.location}
                    </p>
                  )}
                </div>
              </div>
              {church.description && <p className="mt-3 text-sm text-gray-500">{church.description}</p>}
              <button
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#1E5EC8] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1A3A6E]"
                onClick={() =>
                  alert("Your satellite dashboard is coming soon. This section will be expanded over time.")
                }
              >
                Visit my Satellite Dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
