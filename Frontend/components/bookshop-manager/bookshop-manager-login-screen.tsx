"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export function BookshopManagerLoginScreen() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedIdentifier = identifier.trim()
    const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedIdentifier)
    const isPhone = /^\d{11}$/.test(trimmedIdentifier)

    if (!isEmail && !isPhone) {
      toast({
        title: "Incomplete login details",
        description: "Enter a full email address or an 11-digit phone number.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await apiClient.login(trimmedIdentifier, password)
      const profile = await apiClient.getProfile()
      if (profile?.user?.role !== "bookshop_manager") {
        apiClient.logout()
        toast({
          title: "Access denied",
          description: "This account is not a bookshop manager.",
          variant: "destructive",
        })
        return
      }
      router.push("/dashboard/bookshop-manager")
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "Login failed"
      const message = rawMessage === "Request failed" ? "Invalid email/phone or password" : rawMessage
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md shadow-2xl backdrop-blur-sm bg-white/95">
        <CardHeader className="space-y-2 items-center text-center">
          <div className="mb-2 flex items-center justify-center">
            <img src="/logo.png" alt="Dominion City" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl text-[#0E1330]">Bookshop Manager</CardTitle>
          <CardDescription>Sign in to manage the bookshop.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or Phone</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="email or phone number"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#0E1330] hover:bg-[#070A1C] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-xs text-slate-500">
          Bookshop manager access only
        </CardFooter>
      </Card>
    </div>
  )
}
