"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, ShoppingBag, UploadCloud, Warehouse } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export function AdminBookShopScreen() {
  const { toast } = useToast()
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [managers, setManagers] = useState<any[]>([])
  const [isLoadingManagers, setIsLoadingManagers] = useState(true)
  const [managerToDelete, setManagerToDelete] = useState<any | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const uploadsBaseUrl = apiBaseUrl.replace(/\/api$/, "")
  const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg"]

  const chartData = [
    { label: "Mon", sold: 12 },
    { label: "Tue", sold: 18 },
    { label: "Wed", sold: 9 },
    { label: "Thu", sold: 22 },
    { label: "Fri", sold: 16 },
    { label: "Sat", sold: 28 },
    { label: "Sun", sold: 20 },
  ]

  const soldHistory = [
    {
      id: "sold-1",
      title: "Faith in Action",
      author: "T. L. Osborn",
      bookImage: "/placeholder.jpg",
      buyerName: "Kemi Adebayo",
      buyerAvatar: "https://i.pravatar.cc/48?img=12",
    },
    {
      id: "sold-2",
      title: "The Anointing",
      author: "Benny Hinn",
      bookImage: "/placeholder.jpg",
      buyerName: "Samuel Okoro",
      buyerAvatar: "https://i.pravatar.cc/48?img=32",
    },
    {
      id: "sold-3",
      title: "Prayer Rain",
      author: "Dr. D. K. Olukoya",
      bookImage: "/placeholder.jpg",
      buyerName: "Nneka Obi",
      buyerAvatar: "https://i.pravatar.cc/48?img=45",
    },
    {
      id: "sold-4",
      title: "The Power of Faith",
      author: "David Oyedepo",
      bookImage: "/placeholder.jpg",
      buyerName: "Aisha Bello",
      buyerAvatar: "https://i.pravatar.cc/48?img=8",
    },
    {
      id: "sold-5",
      title: "Spirit Life",
      author: "Kenneth E. Hagin",
      bookImage: "/placeholder.jpg",
      buyerName: "Michael Ade",
      buyerAvatar: "https://i.pravatar.cc/48?img=21",
    },
    {
      id: "sold-6",
      title: "Winning Prayer",
      author: "Faith Oyibo",
      bookImage: "/placeholder.jpg",
      buyerName: "Esther Udoh",
      buyerAvatar: "https://i.pravatar.cc/48?img=27",
    },
    {
      id: "sold-7",
      title: "Daily Walk",
      author: "T. D. Jakes",
      bookImage: "/placeholder.jpg",
      buyerName: "Ola Martins",
      buyerAvatar: "https://i.pravatar.cc/48?img=16",
    },
    {
      id: "sold-8",
      title: "Living in the Spirit",
      author: "Joyce Meyer",
      bookImage: "/placeholder.jpg",
      buyerName: "Grace Eze",
      buyerAvatar: "https://i.pravatar.cc/48?img=33",
    },
    {
      id: "sold-9",
      title: "Kingdom Principles",
      author: "Myles Munroe",
      bookImage: "/placeholder.jpg",
      buyerName: "Peter Okafor",
      buyerAvatar: "https://i.pravatar.cc/48?img=39",
    },
  ]

  const transactionsPerPage = 7
  const totalPages = Math.max(1, Math.ceil(soldHistory.length / transactionsPerPage))
  const [currentPage, setCurrentPage] = useState(1)
  const startIndex = (currentPage - 1) * transactionsPerPage
  const pageItems = soldHistory.slice(startIndex, startIndex + transactionsPerPage)

  const resetForm = () => {
    setFirstName("")
    setLastName("")
    setEmail("")
    setPhone("")
    setAddress("")
    setPassword("")
    setConfirmPassword("")
    setProfileImage(null)
    setProfilePreview(null)
  }

  const handleRegisterManager = async () => {
    if (!firstName || !lastName || !email || !phone || !address || !password || !confirmPassword) {
      toast({
        title: "Missing details",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please provide a valid email address.",
        variant: "destructive",
      })
      return
    }

    if (password.length < 8) {
      toast({
        title: "Weak password",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await apiClient.createBookshopManager({
        firstName,
        lastName,
        email,
        phoneNumber: phone,
        address,
        password,
        confirmPassword,
        profileImage,
      })
      if (response?.user) {
        setManagers((prev) => [response.user, ...prev])
      }
      toast({
        title: "Manager registered",
        description: "Bookshop manager account has been created.",
      })
      setIsManagerModalOpen(false)
      resetForm()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to register manager"
      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteManager = async (id: string) => {
    setIsDeleting(true)
    try {
      await apiClient.deleteBookshopManager(id)
      setManagers((prev) => prev.filter((manager) => manager.id !== id))
      toast({ title: "Manager deleted" })
      setIsDeleteModalOpen(false)
      setManagerToDelete(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete manager"
      toast({
        title: "Delete failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const managerItems = managers.map((manager) => {
    const imageValue = manager.profileImage
    const imageUrl = (() => {
      if (!imageValue) return null
      if (imageValue.startsWith("http")) return imageValue
      if (imageValue.startsWith("/uploads/")) return `${uploadsBaseUrl}${imageValue}`
      if (imageValue.startsWith("uploads/")) return `${uploadsBaseUrl}/${imageValue}`
      if (!imageValue.includes("/")) return `${uploadsBaseUrl}/uploads/${imageValue}`
      return imageValue
    })()
    return { ...manager, imageUrl }
  })

  useEffect(() => {
    apiClient
      .getBookshopManagers()
      .then((response) => setManagers(response.managers || []))
      .catch(() => setManagers([]))
      .finally(() => setIsLoadingManagers(false))
  }, [])

  const stats = [
    {
      label: "Total Books Uploaded",
      value: "0",
      icon: BookOpen,
      accent: "bg-indigo-100 text-indigo-500",
    },
    {
      label: "Total Sold Books",
      value: "0",
      icon: ShoppingBag,
      accent: "bg-emerald-100 text-emerald-500",
    },
    {
      label: "Total Unsold Books",
      value: "0",
      icon: Warehouse,
      accent: "bg-amber-100 text-amber-500",
    },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">Book Shop</h1>
          <button
            className="rounded-lg bg-[#3c6eea] px-5 py-2 text-sm font-semibold text-white hover:bg-[#325fd0]"
            onClick={() => {
              resetForm()
              setIsManagerModalOpen(true)
            }}
          >
            Add Bookshop manager
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stats.map((card) => (
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
                  <linearGradient id="soldBooks" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="sold" stroke="#22c55e" strokeWidth={2} fill="url(#soldBooks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="rounded-2xl border-none bg-white p-4 sm:p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-800 sm:text-lg">Sold Books History</h2>
              <span className="text-xs text-slate-500">Recent sales</span>
            </div>
            <div className="mt-6 space-y-4">
              {pageItems.map((sale) => (
                <div
                  key={sale.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-100 px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-12 overflow-hidden rounded-lg bg-slate-100">
                      <img src={sale.bookImage} alt={sale.title} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{sale.title}</p>
                      <p className="text-xs text-slate-500">{sale.author}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={sale.buyerAvatar} alt={sale.buyerName} />
                      <AvatarFallback>{sale.buyerName.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{sale.buyerName}</p>
                      <p className="text-xs text-slate-400">Buyer</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col items-center justify-between gap-3 text-sm text-slate-600 sm:flex-row">
              <span>
                Showing {pageItems.length === 0 ? 0 : startIndex + 1}-{startIndex + pageItems.length} of{" "}
                {soldHistory.length}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  className="inline-flex min-h-[36px] items-center rounded-lg border border-slate-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="text-xs text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="inline-flex min-h-[36px] items-center rounded-lg border border-slate-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-none bg-white p-4 sm:p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-800 sm:text-lg">Bookshop Managers</h2>
              <span className="text-xs text-slate-500">Active</span>
            </div>
            <div className="mt-6 space-y-4">
              {isLoadingManagers ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
                  Loading managers...
                </div>
              ) : managerItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
                  No managers registered yet.
                </div>
              ) : (
                managerItems.map((manager) => (
                  <div
                    key={manager.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={manager.imageUrl || ""} alt={`${manager.firstName} ${manager.lastName}`} />
                        <AvatarFallback>
                          {manager.firstName?.slice(0, 1)}
                          {manager.lastName?.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {manager.firstName} {manager.lastName}
                        </p>
                        <p className="text-xs text-slate-500">{manager.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{manager.phoneNumber || "N/A"}</span>
                      <Button
                        variant="outline"
                        className="border-red-200 text-xs text-red-500 hover:text-red-600"
                        onClick={() => {
                          setManagerToDelete(manager)
                          setIsDeleteModalOpen(true)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <Dialog open={isManagerModalOpen} onOpenChange={setIsManagerModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Add Bookshop Manager</DialogTitle>
              <DialogDescription>Register a new manager for the book shop.</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500">
                {profilePreview ? (
                  <img src={profilePreview} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <UploadCloud className="h-7 w-7" />
                )}
              </div>
              <label className="cursor-pointer text-sm font-semibold text-[#3c6eea]">
                Upload Profile Picture
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null
                    if (file && !allowedImageTypes.includes(file.type)) {
                      toast({
                        title: "Invalid image",
                        description: "Only JPG or PNG images are allowed.",
                        variant: "destructive",
                      })
                      event.target.value = ""
                      setProfileImage(null)
                      setProfilePreview(null)
                      return
                    }
                    setProfileImage(file)
                    if (file) {
                      setProfilePreview(URL.createObjectURL(file))
                    } else {
                      setProfilePreview(null)
                    }
                  }}
                />
              </label>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-600">First Name</label>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="First name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Last Name</label>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Email Address</label>
                <input
                  type="email"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="email@domain.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Phone Number</label>
                <input
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="+234"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-slate-600">Address</label>
              <textarea
                className="mt-2 h-28 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                placeholder="Address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                required
              />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Password</label>
                <input
                  type="password"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Confirm Password</label>
                <input
                  type="password"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsManagerModalOpen(false)}>
                Cancel
              </Button>
              <Button
                className="rounded-full bg-[#5b8cff] px-10 text-white hover:bg-[#4a78e0]"
                onClick={handleRegisterManager}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registering..." : "Register Manager"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Manager</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-800">
                  {managerToDelete ? `${managerToDelete.firstName} ${managerToDelete.lastName}` : "this manager"}
                </span>
                ? This will deactivate their account.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setManagerToDelete(null)
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-500 text-white hover:bg-red-600"
                onClick={() => managerToDelete && handleDeleteManager(managerToDelete.id)}
                disabled={!managerToDelete || isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
