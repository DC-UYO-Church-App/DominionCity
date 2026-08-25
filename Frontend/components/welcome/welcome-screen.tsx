"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Users, Calendar, Headphones, Heart } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface WelcomeScreenProps {
  onComplete?: () => void
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      id: 1,
      title: "Welcome to Golden Heart",
      subtitle: "Dominion City Church",
      description:
        "Connect with your church community, access sermons, and stay updated with church activities all in one place.",
      icon: Heart,
      image: "/placeholder.svg?height=300&width=400",
      color: "bg-gradient-to-br from-[#0E1330] to-[#0052cc]",
    },
    {
      id: 2,
      title: "Stay Connected",
      subtitle: "Join Your Cell Group",
      description:
        "Find and connect with cell groups in your area. Build meaningful relationships with fellow believers.",
      icon: Users,
      image: "/placeholder.svg?height=300&width=400",
      color: "bg-gradient-to-br from-[#0E1330] to-[#004db3]",
    },
    {
      id: 3,
      title: "Never Miss a Service",
      subtitle: "Easy Check-in & Attendance",
      description:
        "Quick and easy check-in for services. Keep track of your attendance and stay engaged with church activities.",
      icon: Calendar,
      image: "/placeholder.svg?height=300&width=400",
      color: "bg-gradient-to-br from-[#0E1330] to-[#003d8a]",
    },
    {
      id: 4,
      title: "Access Sermons Anytime",
      subtitle: "Watch & Listen On-the-Go",
      description: "Stream video sermons on YouTube or download audio messages to listen anywhere, anytime.",
      icon: Headphones,
      image: "/placeholder.svg?height=300&width=400",
      color: "bg-gradient-to-br from-[#0E1330] to-[#002e73]",
    },
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const handleGetStarted = () => {
    if (onComplete) {
      onComplete()
    }
  }

  const handleSkip = () => {
    if (onComplete) {
      onComplete()
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center">
          <div className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0E1330]">
            <span className="text-sm font-bold text-white">GH</span>
          </div>
          <div>
            <h1 className="truncate text-base font-bold text-[#0E1330] sm:text-lg">Golden Heart</h1>
            <p className="text-xs text-gray-600">Dominion City Church</p>
          </div>
        </div>
        <Button variant="ghost" className="text-[#0E1330]" onClick={handleSkip}>
          Skip
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Slides Container */}
        <div className="flex-1 relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((slide, index) => (
              <div key={slide.id} className="w-full flex-shrink-0 flex flex-col">
                {/* Image/Icon Section */}
                <div className={cn("flex flex-1 flex-col items-center justify-center p-6 text-white sm:p-8", slide.color)}>
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 sm:mb-6 sm:h-24 sm:w-24">
                    <slide.icon className="h-10 w-10 text-white sm:h-12 sm:w-12" />
                  </div>
                  <div className="mb-4 flex h-40 w-full max-w-sm items-center justify-center rounded-lg bg-white/10 sm:mb-6 sm:h-48">
                    <img
                      src={slide.image || "/placeholder.svg"}
                      alt={slide.title}
                      className="w-full h-full object-cover rounded-lg opacity-80"
                    />
                  </div>
                </div>

                {/* Content Section */}
                <div className="bg-white p-6 text-center sm:p-8">
                  <h2 className="mb-2 text-xl font-bold text-[#0E1330] sm:text-2xl">{slide.title}</h2>
                  <h3 className="mb-3 text-base font-semibold text-gray-700 sm:mb-4 sm:text-lg">{slide.subtitle}</h3>
                  <p className="mx-auto max-w-sm text-sm leading-relaxed text-gray-600 sm:text-base">{slide.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center bg-white py-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={currentSlide === index ? "true" : undefined}
              className="flex h-11 w-11 items-center justify-center"
            >
              <span
                className={cn(
                  "h-3 w-3 rounded-full transition-colors duration-200",
                  currentSlide === index ? "bg-[#0E1330]" : "bg-gray-300",
                )}
              />
            </button>
          ))}
        </div>

        {/* Bottom Navigation */}
        <div className="border-t bg-white p-4 sm:p-6">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={prevSlide} disabled={currentSlide === 0} className="flex items-center">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            {currentSlide === slides.length - 1 ? (
              <Button onClick={handleGetStarted} className="bg-[#0E1330] hover:bg-[#070A1C] text-white px-8">
                Get Started
              </Button>
            ) : (
              <Button onClick={nextSlide} className="bg-[#0E1330] hover:bg-[#070A1C] text-white flex items-center">
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Alternative Quick Start Section */}
      <div className="bg-gray-50 p-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">Already have an account?</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" className="flex-1 max-w-[120px]" onClick={handleGetStarted}>
              Sign In
            </Button>
            <Link href="/register" className="flex-1 max-w-[120px]">
              <Button variant="outline" className="w-full">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
