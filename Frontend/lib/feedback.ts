/* ============================================================================
   FEEDBACK
   ----------------------------------------------------------------------------
   One place where an API failure becomes something a person can act on, so no
   two screens drift apart in tone or in what they say about the same status
   code. Used across the auth flow and every screen that writes data.

   Every message answers two questions: what happened, and what to do now.
   No "Oops", no raw `Failed to fetch`, no bare status numbers.
   ========================================================================== */
import { toast } from "sonner"
import { ApiError } from "@/lib/api"

type Message = { title: string; description: string }

/**
 * @param overrides  Status-specific copy for cases the screen knows about —
 *                   e.g. 401 on sign-in, 409 on registration.
 * @param fallback   Title for anything unrecognised; the server's own message
 *                   becomes the description when it sent one.
 */
export function toastApiError(
  err: unknown,
  overrides: Record<number, Message> = {},
  fallback = "Something went wrong",
) {
  const status = err instanceof ApiError ? err.status : -1
  const raw = err instanceof Error ? err.message : ""

  const custom = overrides[status]
  if (custom) {
    toast.error(custom.title, { description: custom.description })
    return
  }

  // status 0 means the request never reached the server at all.
  if (status === 0) {
    toast.error("Could not reach the server", {
      description: "Check your connection and try again.",
    })
    return
  }

  if (status === 429) {
    toast.error("Too many attempts", {
      description: "Please wait a few minutes before trying again.",
    })
    return
  }

  toast.error(fallback, { description: raw || "Please try again." })
}
