"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { LayoutDashboard, X } from "lucide-react"
import { apiClient } from "@/lib/api"

type RoleDashboard = { key: string; label: string; path: string; cta?: "Access" | "Go to" }

/**
 * Sits in the member dashboard top bar, beside the notification bell, for
 * members who also hold a role with a dashboard of its own.
 *
 * Nothing renders when the member has no such role, so an ordinary member's
 * top bar is unchanged. One role links straight through. Several open a
 * picker, because guessing which one they meant would be wrong half the time.
 *
 * Lives in the shared layout, so it follows the member through every page of
 * their dashboard rather than only the home screen. The admin and bookshop
 * areas use their own layouts and never show it.
 */
export function RoleDashboardButton() {
  const router = useRouter()
  const [dashboards, setDashboards] = useState<RoleDashboard[]>([])
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // The portal below needs a real document, which server rendering has not got.
  useEffect(() => setIsMounted(true), [])

  useEffect(() => {
    let cancelled = false
    apiClient
      .getMyDashboards()
      .then((response) => {
        if (!cancelled) setDashboards(response?.dashboards || [])
      })
      .catch(() => {
        // A member who cannot be told their roles simply sees no button.
        if (!cancelled) setDashboards([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Escape closes the picker, as it would any dialog.
  useEffect(() => {
    if (!isPickerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsPickerOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isPickerOpen])

  if (dashboards.length === 0) return null

  const single = dashboards.length === 1 ? dashboards[0] : null
  const label = single
    ? `${single.cta ?? "Access"} ${single.label} Dashboard`
    : "Access your dashboards"

  return (
    <>
      <button
        type="button"
        onClick={() => (single ? router.push(single.path) : setIsPickerOpen(true))}
        className="dash-btn dash-btn--ink dash-btn--sm"
        aria-label={label}
        title={label}
      >
        <LayoutDashboard />
        {/* The label would crowd the page title on a phone, so below the sm
            breakpoint the icon carries it and aria-label does the rest. */}
        <span className="hidden whitespace-nowrap sm:inline">{label}</span>
      </button>

      {isPickerOpen &&
        isMounted &&
        createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dashboard-picker-title"
          onClick={() => setIsPickerOpen(false)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-md sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 id="dashboard-picker-title" className="font-semibold text-slate-900">
                  Which dashboard?
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  You have more than one dashboard. Pick the one you want to open.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 p-4">
              {dashboards.map((dashboard) => (
                <button
                  key={dashboard.key}
                  type="button"
                  onClick={() => {
                    setIsPickerOpen(false)
                    router.push(dashboard.path)
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition-colors hover:border-[#1A3A6E] hover:bg-[#1A3A6E]/5"
                >
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#1A3A6E]/10 text-[#1A3A6E]">
                    <LayoutDashboard className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">
                      {dashboard.label} Dashboard
                    </span>
                    <span className="sr-only">{dashboard.cta ?? "Access"}</span>
                    <span className="block truncate text-xs text-slate-400">{dashboard.path}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
