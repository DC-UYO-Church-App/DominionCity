"use client"

import { useEffect, useMemo, useState } from "react"
import { Clock, MapPin, CalendarRange } from "lucide-react"
import { apiClient } from "@/lib/api"

const DAY_ORDER = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function MemberActivitiesScreen() {
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiClient
      .getWeeklyActivities(true)
      .then((res) => setActivities(res.activities || []))
      .catch(() => setActivities([]))
      .finally(() => setIsLoading(false))
  }, [])

  const byDay = useMemo(() => {
    const groups: Record<string, any[]> = {}
    activities.forEach((a) => {
      const day = a.dayOfWeek || "Other"
      groups[day] = groups[day] || []
      groups[day].push(a)
    })
    return DAY_ORDER.filter((d) => groups[d]?.length).map((d) => ({ day: d, items: groups[d] }))
  }, [activities])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1A3A6E] sm:text-2xl">Weekly Activities</h1>
        <p className="text-sm text-gray-500">Our regular weekly programs and gatherings.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-gray-100 bg-white" />
          ))}
        </div>
      ) : byDay.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400">No weekly activities posted yet.</p>
      ) : (
        <div className="space-y-6">
          {byDay.map(({ day, items }) => (
            <div key={day}>
              <div className="mb-2 flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-[#1E5EC8]" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-[#1A3A6E]">{day}</h2>
              </div>
              <div className="space-y-2">
                {items.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-gray-100 bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                  >
                    <p className="font-semibold text-gray-900">{a.title}</p>
                    {a.description && <p className="mt-0.5 text-xs text-gray-500">{a.description}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                      {(a.startTime || a.endTime) && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {a.startTime ? String(a.startTime).slice(0, 5) : ""}
                          {a.endTime ? ` - ${String(a.endTime).slice(0, 5)}` : ""}
                        </span>
                      )}
                      {a.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {a.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
