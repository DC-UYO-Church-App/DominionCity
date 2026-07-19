"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CreditCard, Clock, Trophy, FolderKanban, CalendarDays } from "lucide-react"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const naira = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(
    value || 0
  )

export function AdminGivingScreen() {
  const [stats, setStats] = useState<any>(null)
  const [pending, setPending] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  // Second-layer confirmation: holds the contribution + whether we're confirming or rejecting
  const [decision, setDecision] = useState<{ contribution: any; confirm: boolean } | null>(null)

  const load = async () => {
    setIsLoading(true)
    try {
      const [statsRes, pendingRes] = await Promise.all([
        apiClient.getGivingStats(),
        apiClient.getContributions({ status: "pending" }),
      ])
      setStats(statsRes)
      setPending(pendingRes.contributions || [])
    } catch {
      setStats(null)
      setPending([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const runDecision = async () => {
    if (!decision) return
    const { contribution, confirm } = decision
    const id = contribution.id
    setProcessingId(id)
    setDecision(null)
    try {
      if (confirm) {
        await apiClient.confirmContribution(id)
      } else {
        await apiClient.rejectContribution(id)
      }
      setPending((prev) => prev.filter((c) => c.id !== id))
      toast.success(confirm ? "Payment confirmed" : "Payment rejected")
      // Refresh totals after a confirmation
      if (confirm) {
        apiClient.getGivingStats().then(setStats).catch(() => {})
      }
    } catch (error) {
      toast.error("Action failed", {
        description: error instanceof Error ? error.message : "Failed to update",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const summaryCards = [
    {
      icon: CreditCard,
      label: "Total Given",
      value: naira(Number(stats?.totalGiven || 0)),
      tint: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: Clock,
      label: "Pending Confirmation",
      value: naira(Number(stats?.totalPending || 0)),
      tint: "bg-amber-50 text-amber-600",
    },
    {
      icon: Trophy,
      label: "Givers",
      value: String(stats?.givers?.length || 0),
      tint: "bg-[#3c6eea]/10 text-[#3c6eea]",
    },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-800">Giving</h1>

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          {summaryCards.map((c) => (
            <Card
              key={c.label}
              className="flex items-center gap-4 rounded-2xl border-none bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${c.tint}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{c.label}</p>
                <p className="text-xl font-bold text-slate-800">{isLoading ? "—" : c.value}</p>
              </div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="w-full justify-start rounded-full bg-white p-1 shadow-sm">
            <TabsTrigger value="pending" className="rounded-full px-6">
              Pending {pending.length > 0 ? `(${pending.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="top" className="rounded-full px-6">
              Top Givers
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="rounded-full px-6">
              By Project / Program
            </TabsTrigger>
            <TabsTrigger value="givers" className="rounded-full px-6">
              All Givers
            </TabsTrigger>
          </TabsList>

          {/* Pending confirmations */}
          <TabsContent value="pending">
            <Card className="rounded-2xl border-none bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
              {isLoading ? (
                <div className="py-10 text-center text-sm text-slate-400">Loading...</div>
              ) : pending.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">No payments awaiting confirmation.</div>
              ) : (
                <div className="space-y-4">
                  {pending.map((c) => (
                    <div
                      key={c.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {c.giverName}{" "}
                          {c.isAnonymous && (
                            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                              anonymous
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-slate-500">
                          {naira(Number(c.amount))} · {c.sourceType} · {c.sourceTitle || "—"}
                        </p>
                        <p className="text-xs text-slate-400">
                          Marked paid {new Date(c.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          className="bg-emerald-500 text-white hover:bg-emerald-600"
                          disabled={processingId === c.id}
                          onClick={() => setDecision({ contribution: c, confirm: true })}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-500 hover:text-red-600"
                          disabled={processingId === c.id}
                          onClick={() => setDecision({ contribution: c, confirm: false })}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Top givers */}
          <TabsContent value="top">
            <Card className="rounded-2xl border-none bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
              {isLoading ? (
                <div className="py-10 text-center text-sm text-slate-400">Loading...</div>
              ) : !stats?.topGivers?.length ? (
                <div className="py-10 text-center text-sm text-slate-400">No confirmed giving yet.</div>
              ) : (
                <ol className="space-y-2">
                  {stats.topGivers.map((g: any, i: number) => (
                    <li
                      key={g.userId}
                      className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3c6eea]/10 text-xs font-bold text-[#3c6eea]">
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium text-slate-700">{g.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{naira(Number(g.total))}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </TabsContent>

          {/* Breakdown */}
          <TabsContent value="breakdown">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="rounded-2xl border-none bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                <div className="mb-4 flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-[#3c6eea]" />
                  <h3 className="font-semibold text-slate-800">Projects</h3>
                </div>
                {!stats?.byProject?.length ? (
                  <p className="py-6 text-center text-sm text-slate-400">No projects.</p>
                ) : (
                  <ul className="space-y-2">
                    {stats.byProject.map((p: any) => (
                      <li key={p.id} className="flex items-center justify-between border-b border-slate-50 py-2 text-sm">
                        <span className="text-slate-600">{p.title}</span>
                        <span className="font-semibold text-slate-900">{naira(Number(p.total))}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <Card className="rounded-2xl border-none bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                <div className="mb-4 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[#3c6eea]" />
                  <h3 className="font-semibold text-slate-800">Programs</h3>
                </div>
                {!stats?.byProgram?.length ? (
                  <p className="py-6 text-center text-sm text-slate-400">No programs.</p>
                ) : (
                  <ul className="space-y-2">
                    {stats.byProgram.map((p: any) => (
                      <li key={p.id} className="flex items-center justify-between border-b border-slate-50 py-2 text-sm">
                        <span className="text-slate-600">{p.title}</span>
                        <span className="font-semibold text-slate-900">{naira(Number(p.total))}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* All givers */}
          <TabsContent value="givers">
            <Card className="rounded-2xl border-none bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
              {isLoading ? (
                <div className="py-10 text-center text-sm text-slate-400">Loading...</div>
              ) : !stats?.givers?.length ? (
                <div className="py-10 text-center text-sm text-slate-400">No givers yet.</div>
              ) : (
                <ul className="space-y-2">
                  {stats.givers.map((g: any) => (
                    <li
                      key={g.userId}
                      className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-700">{g.name}</p>
                        <p className="text-xs text-slate-400">{g.count} contribution(s)</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{naira(Number(g.total))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Second-layer confirmation modal */}
      <AlertDialog open={!!decision} onOpenChange={(open) => !open && setDecision(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {decision?.confirm ? "Confirm this payment?" : "Reject this payment?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {decision ? (
                <>
                  You are about to{" "}
                  <span className={decision.confirm ? "font-semibold text-emerald-600" : "font-semibold text-red-500"}>
                    {decision.confirm ? "confirm" : "reject"}
                  </span>{" "}
                  {naira(Number(decision.contribution.amount))} from{" "}
                  <span className="font-semibold">{decision.contribution.giverName}</span> toward{" "}
                  <span className="font-semibold">{decision.contribution.sourceTitle || decision.contribution.sourceType}</span>.
                  {decision.confirm
                    ? " This will be added to the giving totals."
                    : " The giver will be notified it was not confirmed."}{" "}
                  This action cannot be undone.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={runDecision}
              className={
                decision?.confirm
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-red-500 text-white hover:bg-red-600"
              }
            >
              {decision?.confirm ? "Yes, Confirm" : "Yes, Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}
