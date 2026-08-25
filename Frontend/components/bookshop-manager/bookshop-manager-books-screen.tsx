"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UploadCloud } from "lucide-react"
import { BookshopManagerBottomNav } from "@/components/bookshop-manager/bookshop-manager-bottom-nav"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function BookshopManagerBooksScreen() {
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [category, setCategory] = useState("")
  const [price, setPrice] = useState("")
  const [quantity, setQuantity] = useState("")
  const [summary, setSummary] = useState("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [books, setBooks] = useState<any[]>([])
  const [isLoadingBooks, setIsLoadingBooks] = useState(true)
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const uploadsBaseUrl = apiBaseUrl.replace(/\/api$/, "")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg"]

  const categoryOptions = [
    "Religion & Spirituality",
    "Devotionals & Prayer Books",
    "Leadership",
    "Children & Young Adult",
    "Fiction",
    "Non-Fiction",
    "Academic / Textbooks",
    "Business & Finance",
    "Technology",
    "Health & Lifestyle",
    "Comics & Graphic Novels",
  ]

  const resetForm = () => {
    setTitle("")
    setAuthor("")
    setCategory("")
    setPrice("")
    setQuantity("")
    setSummary("")
    setCoverFile(null)
    setCoverPreview(null)
    setEditingId(null)
  }

  const handleSaveBook = async () => {
    if (!title || !author || !category || !price || !quantity) {
      toast({
        title: "Missing details",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const parsedPrice = Number(price)
    const parsedQuantity = Number(quantity)
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price.",
        variant: "destructive",
      })
      return
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid quantity.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      if (editingId) {
        await apiClient.updateBook(editingId, {
          title,
          author,
          category,
          price: parsedPrice,
          quantity: parsedQuantity,
          summary: summary || undefined,
          coverFile: coverFile || undefined,
        })
      } else {
        await apiClient.createBook({
          title,
          author,
          category,
          price: parsedPrice,
          quantity: parsedQuantity,
          summary: summary || undefined,
          coverFile,
        })
      }
      const refreshed = await apiClient.getBooks()
      setBooks(refreshed.books || [])
      toast({
        title: editingId ? "Book updated" : "Book saved",
        description: editingId ? "The book has been updated." : "The book has been added successfully.",
      })
      setIsModalOpen(false)
      resetForm()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save book"
      toast({
        title: "Save failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resolveCoverUrl = (coverValue?: string | null) => {
    if (!coverValue) return null
    if (coverValue.startsWith("http")) return coverValue
    if (coverValue.startsWith("/uploads/")) return `${uploadsBaseUrl}${coverValue}`
    if (coverValue.startsWith("uploads/")) return `${uploadsBaseUrl}/${coverValue}`
    if (!coverValue.includes("/")) return `${uploadsBaseUrl}/uploads/${coverValue}`
    return coverValue
  }

  const handleEditBook = (book: any) => {
    setEditingId(book.id)
    setTitle(book.title || "")
    setAuthor(book.author || "")
    setCategory(book.category || "")
    setPrice(book.price?.toString?.() || "")
    setQuantity(book.quantity?.toString?.() || "")
    setSummary(book.summary || "")
    setCoverFile(null)
    setCoverPreview(resolveCoverUrl(book.coverImage))
    setIsModalOpen(true)
  }

  const handleDeleteBook = async (id: string) => {
    if (!window.confirm("Delete this book?")) {
      return
    }
    try {
      await apiClient.deleteBook(id)
      setBooks((prev) => prev.filter((book) => book.id !== id))
      toast({ title: "Book deleted" })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete book"
      toast({
        title: "Delete failed",
        description: message,
        variant: "destructive",
      })
    }
  }

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
      .getBooks()
      .then((response) => setBooks(response.books || []))
      .catch(() => setBooks([]))
      .finally(() => setIsLoadingBooks(false))
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
            <h1 className="truncate text-base font-semibold text-slate-800 sm:text-lg">Books</h1>
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Books</h2>
          <Button
            className="rounded-lg bg-[#3c6eea] px-4 text-sm text-white hover:bg-[#325fd0]"
            onClick={() => {
              resetForm()
              setIsModalOpen(true)
            }}
          >
            Add Books
          </Button>
        </div>

        <Card className="rounded-2xl border-none bg-white p-4 sm:p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          {isLoadingBooks ? (
            <div className="py-6 text-sm text-slate-400">Loading books...</div>
          ) : books.length === 0 ? (
            <p className="text-sm text-slate-500">No books added yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {books.map((book) => {
                const imageUrl = resolveCoverUrl(book.coverImage)
                return (
                  <div
                    key={book.id}
                    className="group relative rounded-xl border border-slate-100 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition group-hover:opacity-100">
                      <Button
                        variant="outline"
                        className="h-7 rounded-full border-slate-200 px-2 text-[11px]"
                        onClick={() => handleEditBook(book)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="h-7 rounded-full border-red-200 px-2 text-[11px] text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteBook(book.id)}
                      >
                        Delete
                      </Button>
                    </div>
                    <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-slate-100">
                      {imageUrl ? (
                        <img src={imageUrl} alt={book.title} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="mt-3 space-y-1">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-2">{book.title}</p>
                      <p className="text-xs text-slate-500">{book.author}</p>
                      <p className="text-[11px] text-slate-400">{book.category}</p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">
                          ₦{Number(book.price || 0).toLocaleString()}
                        </span>
                        <span>Qty: {book.quantity ?? 0}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </main>

      <BookshopManagerBottomNav />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Book" : "Add Book"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update the book details below." : "Fill in the book details below."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500">
              {coverPreview ? (
                <img src={coverPreview} alt="Book cover" className="h-full w-full object-cover" />
              ) : (
                <UploadCloud className="h-7 w-7" />
              )}
            </div>
            <label className="cursor-pointer text-sm font-semibold text-[#3c6eea]">
              Upload Cover Image
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
                    setCoverFile(null)
                    setCoverPreview(null)
                    return
                  }
                  setCoverFile(file)
                  if (file) {
                    setCoverPreview(URL.createObjectURL(file))
                  } else {
                    setCoverPreview(null)
                  }
                }}
              />
            </label>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-600">Book Title</label>
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                placeholder="Book title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600">Author</label>
              <input
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                placeholder="Author"
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600">Category</label>
              <select
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                required
              >
                <option value="">Select category</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600">Price</label>
              <div className="mt-2 flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3">
                <span className="text-sm text-slate-500">₦</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full bg-transparent px-3 py-3 text-sm outline-none"
                  placeholder="0.00"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600">Quantity</label>
              <input
                type="number"
                min="0"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                placeholder="0"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-600">Book Summary</label>
              <textarea
                className="mt-2 h-32 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                placeholder="Book summary"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-full bg-[#5b8cff] px-10 text-white hover:bg-[#4a78e0]"
              onClick={handleSaveBook}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : editingId ? "Save Changes" : "Save Book"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
