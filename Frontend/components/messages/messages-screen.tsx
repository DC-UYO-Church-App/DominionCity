"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Play, Download, Calendar, User, Video, Headphones } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function MessagesScreen() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpeaker, setSelectedSpeaker] = useState("all")
  const [selectedType, setSelectedType] = useState("all")

  // Mock sermon data with YouTube links and audio files
  const sermons = [
    {
      id: 1,
      title: "The Power of Faith",
      speaker: "Pastor David Ogbueli",
      date: "May 26, 2025",
      duration: "45 min",
      type: "video",
      thumbnail: "/placeholder.svg?height=120&width=200",
      description: "Understanding how faith moves mountains and transforms lives.",
      series: "Faith Series",
      youtubeId: "dQw4w9WgXcQ", // Example YouTube ID
      views: "1.2K",
    },
    {
      id: 2,
      title: "Walking in Divine Favor",
      speaker: "Pastor Nonso Agu",
      date: "May 19, 2025",
      duration: "38 min",
      type: "audio",
      thumbnail: "/placeholder.svg?height=120&width=200",
      description: "Discovering God's favor in every season of life.",
      series: "Favor Series",
      audioUrl: "/audio/sermon-2.mp3",
      downloads: "856",
    },
    {
      id: 3,
      title: "The Heart of Worship",
      speaker: "Pastor David Ogbueli",
      date: "May 12, 2025",
      duration: "42 min",
      type: "video",
      thumbnail: "/placeholder.svg?height=120&width=200",
      description: "True worship comes from the heart, not just the lips.",
      series: "Worship Series",
      youtubeId: "dQw4w9WgXcQ",
      views: "2.1K",
    },
    {
      id: 4,
      title: "Building Strong Relationships",
      speaker: "Pastor Nonso Agu",
      date: "May 5, 2025",
      duration: "35 min",
      type: "audio",
      thumbnail: "/placeholder.svg?height=120&width=200",
      description: "Biblical principles for healthy relationships.",
      series: "Relationship Series",
      audioUrl: "/audio/sermon-4.mp3",
      downloads: "643",
    },
    {
      id: 5,
      title: "Living with Purpose",
      speaker: "Pastor David Ogbueli",
      date: "April 28, 2025",
      duration: "40 min",
      type: "video",
      thumbnail: "/placeholder.svg?height=120&width=200",
      description: "Discovering and fulfilling your God-given purpose.",
      series: "Purpose Series",
      youtubeId: "dQw4w9WgXcQ",
      views: "1.8K",
    },
    {
      id: 6,
      title: "The Joy of Giving",
      speaker: "Pastor Nonso Agu",
      date: "April 21, 2025",
      duration: "33 min",
      type: "audio",
      thumbnail: "/placeholder.svg?height=120&width=200",
      description: "Understanding the biblical principles of generous giving.",
      series: "Stewardship Series",
      audioUrl: "/audio/sermon-6.mp3",
      downloads: "721",
    },
  ]

  const speakers = ["all", "Pastor David Ogbueli", "Pastor Nonso Agu"]
  const types = ["all", "video", "audio"]

  const filteredSermons = sermons.filter((sermon) => {
    const matchesSearch =
      sermon.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sermon.speaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sermon.series.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSpeaker = selectedSpeaker === "all" || sermon.speaker === selectedSpeaker
    const matchesType = selectedType === "all" || sermon.type === selectedType
    return matchesSearch && matchesSpeaker && matchesType
  })

  const handlePlayVideo = (youtubeId: string) => {
    // In a real app, this would open a video player or navigate to YouTube
    window.open(`https://www.youtube.com/watch?v=${youtubeId}`, "_blank")
  }

  const handlePlayAudio = (audioUrl: string) => {
    // In a real app, this would open an audio player
    console.log(`Playing audio: ${audioUrl}`)
  }

  const handleDownload = (sermon: any) => {
    // In a real app, this would trigger a download
    console.log(`Downloading: ${sermon.title}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0E1330]">Sermons & Media</h1>
        <p className="text-gray-600">Watch and listen to church sermons</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search sermons, speakers, or series..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by speaker" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Speakers</SelectItem>
              {speakers.slice(1).map((speaker) => (
                <SelectItem key={speaker} value={speaker}>
                  {speaker}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Media type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Sermons</TabsTrigger>
          <TabsTrigger value="video">Video Sermons</TabsTrigger>
          <TabsTrigger value="audio">Audio Sermons</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid gap-4">
            {filteredSermons.map((sermon) => (
              <Card key={sermon.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row">
                  <div className="relative w-full sm:w-48 h-32 sm:h-auto">
                    <img
                      src={sermon.thumbnail || "/placeholder.svg"}
                      alt={sermon.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        className="bg-[#0E1330] hover:bg-[#070A1C] text-white"
                        onClick={() =>
                          sermon.type === "video"
                            ? handlePlayVideo(sermon.youtubeId!)
                            : handlePlayAudio(sermon.audioUrl!)
                        }
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Play
                      </Button>
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="bg-black/70 text-white">
                        {sermon.type === "video" ? (
                          <>
                            <Video className="h-3 w-3 mr-1" />
                            Video
                          </>
                        ) : (
                          <>
                            <Headphones className="h-3 w-3 mr-1" />
                            Audio
                          </>
                        )}
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                        {sermon.duration}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{sermon.title}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{sermon.description}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(sermon)} className="ml-2">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {sermon.speaker}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {sermon.date}
                      </div>
                      {sermon.type === "video" && sermon.views && (
                        <div className="flex items-center">
                          <span>{sermon.views} views</span>
                        </div>
                      )}
                      {sermon.type === "audio" && sermon.downloads && (
                        <div className="flex items-center">
                          <span>{sermon.downloads} downloads</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{sermon.series}</Badge>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-[#0E1330] hover:bg-[#070A1C] text-white"
                          onClick={() =>
                            sermon.type === "video"
                              ? handlePlayVideo(sermon.youtubeId!)
                              : handlePlayAudio(sermon.audioUrl!)
                          }
                        >
                          <Play className="h-4 w-4 mr-1" />
                          {sermon.type === "video" ? "Watch" : "Listen"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="video" className="mt-6">
          <div className="grid gap-4">
            {filteredSermons
              .filter((s) => s.type === "video")
              .map((sermon) => (
                <Card key={sermon.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative w-full sm:w-48 h-32 sm:h-auto">
                      <img
                        src={sermon.thumbnail || "/placeholder.svg"}
                        alt={sermon.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          className="bg-[#0E1330] hover:bg-[#070A1C] text-white"
                          onClick={() => handlePlayVideo(sermon.youtubeId!)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Watch
                        </Button>
                      </div>
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="bg-red-600 text-white">
                          <Video className="h-3 w-3 mr-1" />
                          YouTube
                        </Badge>
                      </div>
                      <div className="absolute bottom-2 right-2">
                        <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                          {sermon.duration}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex-1 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{sermon.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{sermon.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {sermon.speaker}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {sermon.date}
                        </div>
                        <div className="flex items-center">
                          <span>{sermon.views} views</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{sermon.series}</Badge>
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => handlePlayVideo(sermon.youtubeId!)}
                        >
                          <Video className="h-4 w-4 mr-1" />
                          Watch on YouTube
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="audio" className="mt-6">
          <div className="grid gap-4">
            {filteredSermons
              .filter((s) => s.type === "audio")
              .map((sermon) => (
                <Card key={sermon.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative w-full sm:w-48 h-32 sm:h-auto">
                      <img
                        src={sermon.thumbnail || "/placeholder.svg"}
                        alt={sermon.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          className="bg-[#0E1330] hover:bg-[#070A1C] text-white"
                          onClick={() => handlePlayAudio(sermon.audioUrl!)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Listen
                        </Button>
                      </div>
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="bg-[#0E1330] text-white">
                          <Headphones className="h-3 w-3 mr-1" />
                          Audio
                        </Badge>
                      </div>
                      <div className="absolute bottom-2 right-2">
                        <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                          {sermon.duration}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex-1 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{sermon.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{sermon.description}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(sermon)} className="ml-2">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {sermon.speaker}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {sermon.date}
                        </div>
                        <div className="flex items-center">
                          <span>{sermon.downloads} downloads</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{sermon.series}</Badge>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleDownload(sermon)}>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            className="bg-[#0E1330] hover:bg-[#070A1C] text-white"
                            onClick={() => handlePlayAudio(sermon.audioUrl!)}
                          >
                            <Headphones className="h-4 w-4 mr-1" />
                            Listen
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredSermons.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-600">No sermons found matching your criteria</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filter options</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
