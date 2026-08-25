"use client"

import { useEffect, useMemo, useState } from "react"
import { Play, Headphones, ChevronLeft, ChevronRight } from "lucide-react"
import { apiClient } from "@/lib/api"

const AIDA_THUMBNAILS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD2Fm5t4V2AWMkZTSRd6a9sPd72MyJUE746FPT0BD4WRKKlafaPDHDOiAgaD3OBS5A5iE9DJ16d-DJ0KMn6vwBGs0gPPwotIhXxNCU8V0BkznEA9BXew0awIxYHoGwZSIoR297kxi816LQA7kjiVcPH6Upf0oiXKhmZ1c1KLzaizLur6lfWUj-JqpGpyYuyQiUq2D3czqucc3HMzsnvIVBrmcN0XFLYyqTH0r_hZLadxb06tacEUkaJEamO6udvXMXiHezcfW5wSw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDfIAYjoqV7TS535iZ0q0UNNudJu-ng71LkZ3H4Ly4DqdstKU4PXdSDejxH31LP0g5ceZBweH5sC30_SuXZA5r7cgWZ4oax2oUCkGLVpt8ik_M6ZztfQiWqPmyTfCf15Qx6SICV2sP9zOoV56F4H7ge21PgkRE35NF01_s7oL7HsLkKaTyssibbjQHccRx6b_CLTRY1NqRsGUnH0xSNpFQ4VuTVv4sd47A1kiaVAb-acCWPJUGkzkn0zopHgxG5V4TO0ePYqWPrTg",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBeFmSVoWhftitc0VEo53UoUze_uq9XNhY8xAu5bMXzLKhJugpSM6VYI4opFs0g4Yir9lsstdACV-U02bSCM5J__N3JOwODG6tXqw8Pjks8NWc5c7QRJIhYbP3S9rMxFm3li4pqH1HrX9FhjXH67mEmlzitpzzPHDy03pvXbJU7XwxXcH77zsC0eQ84CAYAZPkZHIYjtdsNrm7GTvyOfWQm8Fjn8P0av52B2MluJpa_PQojzdNSksFjVjooGIC8-njtFR3VDfkIqA",
]

const PLACEHOLDER_SERMONS = [
  {
    id: "p1",
    title: "Walking in Divine Dominion",
    speaker: "Pst. David Ogbueli",
    date: "Oct 12, 2023",
    rawDate: "2023-10-12",
    duration: "54:20",
    series: "Faith & Grace",
    thumbnail: AIDA_THUMBNAILS[0],
    description: "Understanding your authority in Christ and how to exercise it daily.",
    videoUrl: "",
    audioUrl: "",
    type: "video",
  },
  {
    id: "p2",
    title: "The Steward's Mandate",
    speaker: "Pst. Emmanuel John",
    date: "Oct 05, 2023",
    rawDate: "2023-10-05",
    duration: "42:15",
    series: "Leadership",
    thumbnail: AIDA_THUMBNAILS[1],
    description: "Principles for managing kingdom resources and leading with integrity.",
    videoUrl: "",
    audioUrl: "",
    type: "video",
  },
  {
    id: "p3",
    title: "Covenant Wealth Foundations",
    speaker: "Pst. David Ogbueli",
    date: "Sep 28, 2023",
    rawDate: "2023-09-28",
    duration: "1:02:10",
    series: "Prosperity",
    thumbnail: AIDA_THUMBNAILS[2],
    description: "Building a sustainable financial future on biblical promises and wisdom.",
    videoUrl: "",
    audioUrl: "",
    type: "video",
  },
  {
    id: "p4",
    title: "Raising Kingdom Leaders",
    speaker: "Pst. Emmanuel John",
    date: "Sep 21, 2023",
    rawDate: "2023-09-21",
    duration: "48:30",
    series: "Leadership",
    thumbnail: AIDA_THUMBNAILS[0],
    description: "Discovering your purpose in building the next generation of leaders.",
    videoUrl: "",
    audioUrl: "",
    type: "video",
  },
  {
    id: "p5",
    title: "The Power of Persistent Faith",
    speaker: "Pst. David Ogbueli",
    date: "Sep 14, 2023",
    rawDate: "2023-09-14",
    duration: "57:45",
    series: "Faith & Grace",
    thumbnail: AIDA_THUMBNAILS[1],
    description: "How unwavering faith activates the supernatural in your everyday life.",
    videoUrl: "",
    audioUrl: "",
    type: "video",
  },
  {
    id: "p6",
    title: "Spiritual Growth Blueprint",
    speaker: "Pst. Emmanuel John",
    date: "Sep 07, 2023",
    rawDate: "2023-09-07",
    duration: "39:55",
    series: "Spiritual Growth",
    thumbnail: AIDA_THUMBNAILS[2],
    description: "A practical guide to deepening your relationship with God daily.",
    videoUrl: "",
    audioUrl: "",
    type: "video",
  },
]

const ITEMS_PER_PAGE = 9

const CATEGORIES = ["All Categories", "Faith & Grace", "Leadership", "Prosperity", "Relationships", "Spiritual Growth"]

export function SermonsScreen() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpeaker, setSelectedSpeaker] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedDate, setSelectedDate] = useState("")
  const [pendingDate, setPendingDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sermons, setSermons] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiClient
      .getSermons()
      .then((response) => setSermons(response.sermons || []))
      .catch(() => setSermons([]))
      .finally(() => setIsLoading(false))
  }, [])

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const uploadsBaseUrl = apiBaseUrl.replace(/\/api$/, "")

  const mappedSermons = useMemo(() => {
    const apiMapped = sermons.map((sermon, i) => {
      const thumbnailUrl = sermon.thumbnailUrl
      const thumbnail = thumbnailUrl
        ? thumbnailUrl.startsWith("/uploads/")
          ? `${uploadsBaseUrl}${thumbnailUrl}`
          : thumbnailUrl
        : AIDA_THUMBNAILS[i % AIDA_THUMBNAILS.length]
      const rawDate = sermon.sermonDate ? sermon.sermonDate.slice(0, 10) : ""
      return {
        id: sermon.id,
        title: sermon.title,
        speaker: sermon.preacher || "",
        date: sermon.sermonDate
          ? new Date(sermon.sermonDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "",
        rawDate,
        duration: sermon.duration ? `${sermon.duration} min` : "",
        type: sermon.videoUrl ? "video" : "audio",
        thumbnail,
        description: sermon.description || "",
        series: sermon.category || "General",
        videoUrl: sermon.videoUrl || "",
        audioUrl: sermon.audioUrl || "",
      }
    })
    return apiMapped.length > 0 ? apiMapped : PLACEHOLDER_SERMONS
  }, [sermons, uploadsBaseUrl])

  const speakers = useMemo(() => {
    const unique = Array.from(new Set(mappedSermons.map((s) => s.speaker).filter(Boolean)))
    return unique
  }, [mappedSermons])

  const filteredSermons = useMemo(() => {
    return mappedSermons.filter((sermon) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch = !q || sermon.title.toLowerCase().includes(q) || sermon.speaker.toLowerCase().includes(q)
      const matchesSpeaker = selectedSpeaker === "all" || sermon.speaker === selectedSpeaker
      const matchesCategory = selectedCategory === "all" || sermon.series === selectedCategory
      const matchesDate = !selectedDate || sermon.rawDate.startsWith(selectedDate.slice(0, 7))
      return matchesSearch && matchesSpeaker && matchesCategory && matchesDate
    })
  }, [mappedSermons, searchQuery, selectedSpeaker, selectedCategory, selectedDate])

  const totalPages = Math.max(1, Math.ceil(filteredSermons.length / ITEMS_PER_PAGE))
  const paginatedSermons = filteredSermons.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const applyFilter = () => {
    setSelectedDate(pendingDate)
    setCurrentPage(1)
  }

  const visiblePages = useMemo(() => {
    const pages: (number | "…")[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push("…")
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push("…")
      pages.push(totalPages)
    }
    return pages
  }, [currentPage, totalPages])

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h2 className="mb-1 text-2xl font-bold text-[#0A1F44] sm:text-3xl">Sermon Library</h2>
        <p className="max-w-2xl text-sm text-gray-500 sm:text-base">
          Access our archive of transformative messages. Grow in your faith through the word of God shared at Dominion City Uyo.
        </p>
      </div>

      {/* Filters */}
      <section className="mb-6 rounded-xl border border-gray-200/40 bg-white p-4 shadow-sm sm:mb-8 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Search */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#0A1F44] uppercase tracking-wider">Search Keywords</label>
            <input
              type="text"
              placeholder="Title or Topic..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#1E5EC8] focus:ring-2 focus:ring-[#1E5EC8]/20 transition-all"
            />
          </div>

          {/* Preacher */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#0A1F44] uppercase tracking-wider">Preacher</label>
            <select
              value={selectedSpeaker}
              onChange={(e) => { setSelectedSpeaker(e.target.value); setCurrentPage(1) }}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#1E5EC8] focus:ring-2 focus:ring-[#1E5EC8]/20 transition-all"
            >
              <option value="all">All Preachers</option>
              {speakers.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#0A1F44] uppercase tracking-wider">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1) }}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#1E5EC8] focus:ring-2 focus:ring-[#1E5EC8]/20 transition-all"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c === "All Categories" ? "all" : c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Date + Filter button */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#0A1F44] uppercase tracking-wider">Year / Month</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={pendingDate}
                onChange={(e) => setPendingDate(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#1E5EC8] focus:ring-2 focus:ring-[#1E5EC8]/20 transition-all"
              />
              <button
                onClick={applyFilter}
                className="bg-[#1A3A6E] text-white px-4 rounded-lg hover:bg-[#0A1F44] transition-colors font-semibold text-sm"
              >
                Filter
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sermon Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-200/40 animate-pulse">
              <div className="aspect-video bg-gray-200" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : paginatedSermons.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200/40 p-12 text-center mb-8">
          <p className="text-gray-500 text-base">No sermons match your filters.</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search or clearing the filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {paginatedSermons.map((sermon) => (
            <article
              key={sermon.id}
              className="bg-white rounded-xl overflow-hidden border border-gray-200/40 flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={sermon.thumbnail}
                  alt={sermon.title}
                  className="w-full h-full object-cover"
                />
                {/* Category badge */}
                <span className="absolute top-3 left-3 bg-[#1E5EC8] text-white text-[11px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wide">
                  {sermon.series}
                </span>
                {/* Duration badge */}
                {sermon.duration && (
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                    {sermon.duration}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <h3 className="mb-1 break-words text-base font-bold leading-snug text-[#0A1F44]">{sermon.title}</h3>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed flex-1">{sermon.description}</p>

                <div className="pt-3 border-t border-gray-100 flex flex-col gap-3">
                  {/* Meta */}
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
                    <span className="min-w-0 break-words font-semibold text-[#415e94]">{sermon.speaker}</span>
                    <span className="shrink-0 text-xs text-gray-400">{sermon.date}</span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => sermon.videoUrl && window.open(sermon.videoUrl, "_blank", "noopener,noreferrer")}
                      disabled={!sermon.videoUrl}
                      className="flex items-center justify-center gap-1.5 bg-[#1A3A6E] text-white py-2 rounded-lg font-semibold text-sm hover:bg-[#0A1F44] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      Watch
                    </button>
                    <button
                      onClick={() => sermon.audioUrl && window.open(sermon.audioUrl, "_blank", "noopener,noreferrer")}
                      disabled={!sermon.audioUrl}
                      className="flex items-center justify-center gap-1.5 border border-[#1E5EC8] text-[#1E5EC8] py-2 rounded-lg font-semibold text-sm hover:bg-[#1E5EC8]/5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Headphones className="h-4 w-4" />
                      Listen
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && filteredSermons.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-5 sm:flex-row">
          <p className="text-center text-sm text-gray-500 sm:text-left">
            Showing{" "}
            <span className="font-bold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
            <span className="font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredSermons.length)}</span> of{" "}
            <span className="font-bold">{filteredSermons.length}</span> sermons
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-gray-200 hover:bg-gray-100 transition-colors text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {visiblePages.map((page, i) =>
              page === "…" ? (
                <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">
                  …
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => goToPage(page as number)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm transition-colors ${
                    currentPage === page
                      ? "bg-[#1E5EC8] text-white"
                      : "border border-gray-200 hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  {page}
                </button>
              )
            )}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-9 h-9 rounded-lg flex items-center justify-center border border-gray-200 hover:bg-gray-100 transition-colors text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
