"use client"
/* TEMPORARY — drives a converted admin screen through save + failure. */
import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ApiError, apiClient } from "@/lib/api"
import { AdminActivitiesScreen } from "@/components/admin/admin-activities-screen"

if (typeof window !== "undefined") {
  localStorage.setItem("token", "preview")
  const a = apiClient as any
  a.getProfile = async () => ({ user: { role: "super_admin", firstName: "Ubong" } })
  a.getWeeklyActivities = async () => ({ activities: [] })
}

export default function Preview() {
  const params = useSearchParams()
  const kase = params.get("case") || "save-ok"

  useEffect(() => {
    if (params.get("read")) {
      const out = document.createElement("pre")
      out.id = "out"
      out.textContent = `TOAST::${localStorage.getItem("lastToast") || "NONE"}`
      document.body.appendChild(out)
      return
    }
    localStorage.removeItem("lastToast")
    new MutationObserver(() => {
      const el = document.querySelector("[data-sonner-toast]") as HTMLElement | null
      if (el) localStorage.setItem("lastToast", el.innerText.replace(/\s+/g, " "))
    }).observe(document.body, { childList: true, subtree: true })

    const a = apiClient as any
    a.createWeeklyActivity =
      kase === "save-ok"
        ? async () => ({ activity: { id: "a1" } })
        : async () => { throw new ApiError("Database unavailable", 500) }
    // Open the modal, then submit with an empty title to exercise validation,
    // or with a title to exercise the save path.
    const t = setTimeout(() => {
      const byText = (sel: string, re: RegExp) =>
        (Array.from(document.querySelectorAll(sel)) as HTMLElement[])
          .find((el) => re.test(el.innerText || ""))
      byText("button", /add|new/i)?.click()
      setTimeout(() => {
        if (kase !== "validate") {
          const input = document.querySelector(
            'input[placeholder="e.g. Choir Rehearsal"]',
          ) as HTMLInputElement | null
          if (input) {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!
            setter.call(input, "Choir Rehearsal")
            input.dispatchEvent(new Event("input", { bubbles: true }))
          }
        }
        setTimeout(() => byText("button", /^(add now|save|create|update|submit)/i)?.click(), 120)
      }, 250)
    }, 500)
    return () => clearTimeout(t)
  }, [kase, params])

  if (params.get("read")) return <div />
  return <AdminActivitiesScreen />
}
