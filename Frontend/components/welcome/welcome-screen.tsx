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
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-[#0E1330] flex items-center justify-center mr-3">
            <span className="text-sm font-bold text-white">GH</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#0E1330]">Golden Heart</h1>
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
                <div className={cn("flex-1 flex flex-col items-center justify-center p-8 text-white", slide.color)}>
                  <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-6">
                    <slide.icon className="h-12 w-12 text-white" />
                  </div>
                  <div className="w-full max-w-sm h-48 bg-white/10 rounded-lg mb-6 flex items-center justify-center">
                    <img
                      src={slide.image || "/placeholder.svg"}
                      alt={slide.title}
                      className="w-full h-full object-cover rounded-lg opacity-80"
                    />
                  </div>
                </div>

                {/* Content Section */}
                <div className="bg-white p-8 text-center">
                  <h2 className="text-2xl font-bold text-[#0E1330] mb-2">{slide.title}</h2>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">{slide.subtitle}</h3>
                  <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">{slide.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center space-x-2 py-4 bg-white">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-3 h-3 rounded-full transition-colors duration-200",
                currentSlide === index ? "bg-[#0E1330]" : "bg-gray-300",
              )}
            />
          ))}
        </div>

        {/* Bottom Navigation */}
        <div className="bg-white p-6 border-t">
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
          <div className="flex gap-3 justify-center">
            <Button variant="outline" className="flex-1 max-w-[120px]" onClick={handleGetStarted}>
              Sign In
            </Button>
            <Link href="/register">
              <Button variant="outline" className="flex-1 max-w-[120px]">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
