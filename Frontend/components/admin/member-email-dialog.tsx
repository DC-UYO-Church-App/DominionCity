"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Send,
  X,
  XCircle,
} from "lucide-react"

export type Audience = "active" | "non_active"

type Campaign = {
  id: string
  audience: Audience
  subject: string
  status: "pending" | "sending" | "completed" | "failed" | "interrupted"
  totalRecipients: number
  sentCount: number
  failedCount: number
  batchSize: number
  batchDelayMs: number
  totalBatches: number
  completedBatches: number
  failures: { email: string; reason: string }[]
  error: string | null
}

type AudienceInfo = {
  recipientCount: number
  batchSize: number
  batchDelayMs: number
  totalBatches: number
}

const AUDIENCE_LABELS: Record<Audience, string> = {
  active: "Active members",
  non_active: "Non-active members",
}

const POLL_INTERVAL_MS = 1500

/**
 * Compose-and-send dialog for one audience.
 *
 * The send runs on the server, so this polls the campaign row rather than
 * holding a request open. Everything the progress view shows is a real server
 * value except the countdown between batches, which is derived locally from the
 * moment a batch completes plus the delay the server reported.
 */
export function MemberEmailDialog({
  audience,
  open,
  onClose,
}: {
  audience: Audience
  open: boolean
  onClose: () => void
}) {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [info, setInfo] = useState<AudienceInfo | null>(null)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextBatchAt, setNextBatchAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const lastCompletedBatches = useRef(0)

  const isSending = campaign?.status === "pending" || campaign?.status === "sending"
  const isDone = campaign?.status === "completed" || campaign?.status === "failed"

  // Fresh audience size each time the dialog opens: members may have been
  // reclassified since the page loaded.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    apiClient
      .getEmailAudience(audience)
      .then((response) => {
        if (!cancelled) setInfo(response)
      })
      .catch(() => {
        if (!cancelled) setInfo(null)
      })
    return () => {
      cancelled = true
    }
  }, [open, audience])

  // Reset everything when the dialog is dismissed so the next open starts clean.
  useEffect(() => {
    if (open) return
    setSubject("")
    setBody("")
    setCampaign(null)
    setError(null)
    setNextBatchAt(null)
    lastCompletedBatches.current = 0
  }, [open])

  // Poll while a send is in flight.
  useEffect(() => {
    if (!campaign || !isSending) return
    const id = setInterval(() => {
      apiClient
        .getEmailCampaign(campaign.id)
        .then((response) => setCampaign(response.campaign))
        .catch(() => {
          /* A dropped poll is not fatal; the next tick retries. */
        })
    }, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [campaign, isSending])

  // Drives both the countdown text and the pulse, once per second.
  useEffect(() => {
    if (!isSending && !nextBatchAt) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [isSending, nextBatchAt])

  /* The server pauses between batches but does not publish when the pause ends,
     so the countdown starts from the moment a batch's completion first arrives. */
  useEffect(() => {
    if (!campaign) return
    const completed = campaign.completedBatches
    if (completed > lastCompletedBatches.current) {
      lastCompletedBatches.current = completed
      const more = completed < campaign.totalBatches
      setNextBatchAt(more && isSending ? Date.now() + campaign.batchDelayMs : null)
    }
    if (!isSending) setNextBatchAt(null)
  }, [campaign, isSending])

  const handleSend = useCallback(async () => {
    if (!subject.trim() || !body.trim()) return
    setIsStarting(true)
    setError(null)
    try {
      const response = await apiClient.startEmailCampaign({
        audience,
        subject: subject.trim(),
        body: body.trim(),
      })
      lastCompletedBatches.current = 0
      setCampaign(response.campaign)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the send")
    } finally {
      setIsStarting(false)
    }
  }, [audience, subject, body])

  // Tell the admin the outcome even if they navigated away from the dialog body.
  const notified = useRef<string | null>(null)
  useEffect(() => {
    if (!campaign || !isDone || notified.current === campaign.id) return
    notified.current = campaign.id
    if (campaign.status === "completed") {
      toast.success("Send complete", {
        description: `${campaign.sentCount} of ${campaign.totalRecipients} delivered${
          campaign.failedCount ? `, ${campaign.failedCount} failed` : ""
        }.`,
      })
    } else {
      toast.error("Send failed", {
        description: campaign.error || `${campaign.failedCount} messages could not be sent.`,
      })
    }
  }, [campaign, isDone])

  const secondsToNextBatch = useMemo(() => {
    if (!nextBatchAt) return 0
    return Math.max(0, Math.ceil((nextBatchAt - now) / 1000))
  }, [nextBatchAt, now])

  if (!open) return null

  const recipientCount = info?.recipientCount ?? 0
  const canSend = subject.trim().length > 0 && body.trim().length > 0 && recipientCount > 0

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#1A3A6E]/10 text-[#1A3A6E]">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Email {AUDIENCE_LABELS[audience]}</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {info
                  ? `${recipientCount.toLocaleString()} recipient${recipientCount === 1 ? "" : "s"} - ${info.totalBatches} batch${
                      info.totalBatches === 1 ? "" : "es"
                    } of up to ${info.batchSize}, ${Math.round(info.batchDelayMs / 1000)}s apart`
                  : "Loading audience..."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {campaign ? (
          <BatchProgress
            campaign={campaign}
            secondsToNextBatch={secondsToNextBatch}
            isSending={isSending}
          />
        ) : (
          <div className="space-y-4 px-5 py-5 sm:px-6">
            {recipientCount === 0 && info && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  Nobody is in this group right now, so there is nothing to send.
                </span>
              </div>
            )}

            <div>
              <label htmlFor="campaign-subject" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Subject
              </label>
              <input
                id="campaign-subject"
                type="text"
                value={subject}
                maxLength={200}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="We miss you at Dominion City"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1A3A6E] focus:outline-none focus:ring-2 focus:ring-[#1A3A6E]/20"
              />
            </div>

            <div>
              <label htmlFor="campaign-body" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Message
              </label>
              <textarea
                id="campaign-body"
                value={body}
                rows={9}
                maxLength={20000}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message. Each recipient is greeted by their first name."
                className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1A3A6E] focus:outline-none focus:ring-2 focus:ring-[#1A3A6E]/20"
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Plain text only. Blank lines become paragraphs, and the church header and footer are added automatically.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            {isDone ? "Close" : isSending ? "Run in background" : "Cancel"}
          </button>
          {!campaign && (
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend || isStarting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1A3A6E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0a1f44] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send to {recipientCount.toLocaleString()}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/** Live view of the batch run: overall bar, per-batch chips, and counters. */
function BatchProgress({
  campaign,
  secondsToNextBatch,
  isSending,
}: {
  campaign: Campaign
  secondsToNextBatch: number
  isSending: boolean
}) {
  const processed = campaign.sentCount + campaign.failedCount
  const percent = campaign.totalRecipients
    ? Math.round((processed / campaign.totalRecipients) * 100)
    : 100
  const currentBatch = Math.min(campaign.completedBatches + 1, campaign.totalBatches)
  const isWaiting = isSending && secondsToNextBatch > 0

  const statusLine = isWaiting
    ? `Batch ${campaign.completedBatches} sent. Next batch in ${secondsToNextBatch}s...`
    : isSending
    ? `Sending batch ${currentBatch} of ${campaign.totalBatches}...`
    : campaign.status === "completed"
    ? "All batches sent"
    : campaign.status === "interrupted"
    ? "The server restarted before this send finished"
    : "Send failed"

  return (
    <div className="space-y-5 px-5 py-5 sm:px-6">
      <div className="flex items-center gap-2.5">
        {isSending ? (
          <Loader2 className="h-5 w-5 animate-spin text-[#1A3A6E]" />
        ) : campaign.status === "completed" ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <XCircle className="h-5 w-5 text-rose-500" />
        )}
        <p className="text-sm font-semibold text-slate-800">{statusLine}</p>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
          <span>
            {processed.toLocaleString()} of {campaign.totalRecipients.toLocaleString()} processed
          </span>
          <span>{percent}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              campaign.status === "failed" ? "bg-rose-500" : "bg-[#1A3A6E]"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Batches of {campaign.batchSize}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: campaign.totalBatches }, (_, i) => {
            const index = i + 1
            const done = index <= campaign.completedBatches
            const active = isSending && index === currentBatch && !done
            return (
              <span
                key={index}
                title={`Batch ${index}`}
                className={`inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded-md px-2 text-[11px] font-bold transition-colors ${
                  done
                    ? "bg-[#1A3A6E] text-white"
                    : active
                    ? "animate-pulse bg-[#1A3A6E]/20 text-[#1A3A6E] ring-2 ring-[#1A3A6E]/40"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {index}
              </span>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Sent", value: campaign.sentCount, tone: "text-emerald-600" },
          { label: "Failed", value: campaign.failedCount, tone: "text-rose-600" },
          {
            label: "Batches",
            value: `${campaign.completedBatches}/${campaign.totalBatches}`,
            tone: "text-slate-700",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 p-3">
            <p className={`text-xl font-bold ${stat.tone}`}>
              {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {isSending && (
        <p className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          You can close this dialog. The send continues on the server.
        </p>
      )}

      {campaign.error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{campaign.error}</div>
      )}

      {campaign.failures.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Failed recipients ({campaign.failures.length})
          </p>
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
            {campaign.failures.map((failure, i) => (
              <div key={`${failure.email}-${i}`} className="text-xs">
                <span className="font-semibold text-slate-700">{failure.email}</span>
                <span className="text-slate-400"> - {failure.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
