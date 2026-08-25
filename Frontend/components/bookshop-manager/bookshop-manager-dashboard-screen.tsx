"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { BookOpen, ShoppingBag, Warehouse } from "lucide-react"
import { BookshopManagerBottomNav } from "@/components/bookshop-manager/bookshop-manager-bottom-nav"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function BookshopManagerDashboardScreen() {
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalSold: 0,
    totalUnsold: 0,
  })
  const [chartData, setChartData] = useState<{ label: string; sold: number }[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [isLoadingSales, setIsLoadingSales] = useState(true)
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const uploadsBaseUrl = apiBaseUrl.replace(/\/api$/, "")
  const [profile, setProfile] = useState<any | null>(null)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  const statCards = [
    {
      label: "Total Books Uploaded",
      value: stats.totalBooks.toLocaleString(),
      icon: BookOpen,
      accent: "bg-indigo-100 text-indigo-500",
    },
    {
      label: "Total Sold Books",
      value: stats.totalSold.toLocaleString(),
      icon: ShoppingBag,
      accent: "bg-emerald-100 text-emerald-500",
    },
    {
      label: "Total Unsold Books",
      value: stats.totalUnsold.toLocaleString(),
      icon: Warehouse,
      accent: "bg-amber-100 text-amber-500",
    },
  ]

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) {
      router.replace("/bookshop-manager/login")
      return
    }

    apiClient
      .getProfile()
      .then((response) => {
        if (response?.user?.role !== "bookshop_manager") {
          apiClient.logout()
          router.replace("/bookshop-manager/login")
          return
        }
        setProfile(response.user)
        setIsCheckingAuth(false)
      })
      .catch(() => {
        apiClient.logout()
        router.replace("/bookshop-manager/login")
      })
  }, [router])

  useEffect(() => {
    apiClient
      .getBookStats()
      .then((response) => {
        setStats({
          totalBooks: response.totalBooks || 0,
          totalSold: response.totalSold || 0,
          totalUnsold: response.totalUnsold || 0,
        })
        setChartData(response.last7Days || [])
      })
      .catch(() => {
        setStats({ totalBooks: 0, totalSold: 0, totalUnsold: 0 })
        setChartData([])
      })
  }, [])

  const profileImage = (() => {
    const value = profile?.profileImage
    if (!value) return null
    if (value.startsWith("http")) return value
    if (value.startsWith("/uploads/")) return `${uploadsBaseUrl}${value}`
    if (value.startsWith("uploads/")) return `${uploadsBaseUrl}/${value}`
    if (!value.includes("/")) return `${uploadsBaseUrl}/uploads/${value}`
    return value
  })()

  useEffect(() => {
    apiClient
      .getBooks()
      .then((response) => {
        const books = response.books || []
        const totalBooks = books.length
        const totalUnsold = books.reduce((sum: number, book: any) => sum + (book.quantity ?? 0), 0)
        setStats((prev) => ({
          ...prev,
          totalBooks,
          totalUnsold,
        }))
      })
      .catch(() => {
        // Keep existing stats if books fail to load
      })
  }, [])

  useEffect(() => {
    apiClient
      .getBookSales()
      .then((response) => setSales(response.sales || []))
      .catch(() => setSales([]))
      .finally(() => setIsLoadingSales(false))
  }, [])

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-white" />
  }

  return (
    <div className="min-h-screen bg-[#f5f6fb] text-slate-900">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/logo.png" alt="Dominion City" className="h-7 w-auto shrink-0 sm:h-8" />
          <div>
            <p className="text-xs uppercase text-slate-400">Bookshop</p>
            <h1 className="truncate text-base font-semibold text-slate-800 sm:text-lg">Manager Dashboard</h1>
          </div>
        </div>
        <DropdownMenu open={isProfileMenuOpen} onOpenChange={setIsProfileMenuOpen}>
          <div
            onMouseEnter={() => setIsProfileMenuOpen(true)}
            onMouseLeave={() => setIsProfileMenuOpen(false)}
          >
            <DropdownMenuTrigger asChild>
              <button className="rounded-full border border-slate-200 p-1 hover:bg-slate-50">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={profileImage || ""} alt={profile?.firstName || "Profile"} />
                  <AvatarFallback>{profile?.firstName?.slice(0, 1) || "U"}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  apiClient.logout()
                  router.replace("/bookshop-manager/login")
                }}
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </div>
        </DropdownMenu>
      </header>

      <main className="space-y-6 px-4 py-4 pb-28 sm:px-6 sm:py-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {statCards.map((card) => (
            <Card
              key={card.label}
              className="rounded-2xl border-none bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{card.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.accent}`}>
                  <card.icon className="h-6 w-6" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="rounded-2xl border-none bg-white p-4 sm:p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-800 sm:text-lg">Sold Books</h2>
            <span className="text-xs text-slate-500">Last 7 days</span>
          </div>
          <div className="mt-6 h-64 w-full rounded-xl bg-gradient-to-b from-slate-50 to-white">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="soldBooksManager" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "#e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sold"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#soldBooksManager)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-2xl border-none bg-white p-4 sm:p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-800 sm:text-lg">Sold Books History</h2>
            <span className="text-xs text-slate-500">Recent purchases</span>
          </div>
          <div className="mt-6 space-y-4">
            {isLoadingSales ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
                Loading sales...
              </div>
            ) : sales.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
                No purchases yet.
              </div>
            ) : (
              sales.map((sale) => {
                const bookCover = (() => {
                  const value = sale.coverImage
                  if (!value) return null
                  if (value.startsWith("http")) return value
                  if (value.startsWith("/uploads/")) return `${uploadsBaseUrl}${value}`
                  if (value.startsWith("uploads/")) return `${uploadsBaseUrl}/${value}`
                  if (!value.includes("/")) return `${uploadsBaseUrl}/uploads/${value}`
                  return value
                })()
                const buyerImage = (() => {
                  const value = sale.buyerImage
                  if (!value) return null
                  if (value.startsWith("http")) return value
                  if (value.startsWith("/uploads/")) return `${uploadsBaseUrl}${value}`
                  if (value.startsWith("uploads/")) return `${uploadsBaseUrl}/${value}`
                  if (!value.includes("/")) return `${uploadsBaseUrl}/uploads/${value}`
                  return value
                })()
                return (
                  <div
                    key={sale.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-12 overflow-hidden rounded-lg bg-slate-100">
                        {bookCover ? (
                          <img src={bookCover} alt={sale.title} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{sale.title}</p>
                        <p className="text-xs text-slate-500">Qty: {sale.quantity}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={buyerImage || ""} alt={sale.buyerName} />
                        <AvatarFallback>{sale.buyerName?.slice(0, 1)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{sale.buyerName}</p>
                        <p className="text-xs text-slate-400">Buyer</p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </main>
      <BookshopManagerBottomNav />
    </div>
  )
}
