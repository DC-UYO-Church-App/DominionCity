"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import { toastApiError } from "@/lib/feedback"

export function SuperAdminLoginScreen() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await apiClient.login(identifier.trim(), password)
      const profile = await apiClient.getProfile()
      if (profile?.user?.role !== "super_admin") {
        // The credentials were valid, so a token is now held. Telling someone
        // they are denied while leaving them signed in is worse than useless —
        // drop it before saying so.
        apiClient.logout()
        toast.error("Access denied", {
          description: "That account does not have super-admin privileges.",
        })
        setIsSubmitting(false)
        return
      }
      toast.success("Signed in as super admin", { description: "Opening the admin console." })
      router.push("/dashboard/admin")
    } catch (error) {
      toastApiError(
        error,
        {
          401: {
            title: "Those details don't match",
            description: "The email or phone and password combination is not recognised.",
          },
        },
        "Sign in failed",
      )
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 shadow-2xl backdrop-blur-sm">
        <CardHeader className="space-y-2 items-center text-center">
          <img src="/logo.png" alt="Dominion City" className="h-16 w-auto" />
          <CardTitle className="text-2xl text-[#0E1330]">Super Admin Login</CardTitle>
          <CardDescription>Restricted access</CardDescription>
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
            <Button type="submit" className="w-full bg-[#0E1330] hover:bg-[#070A1C] text-white" disabled={isSubmitting}>
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-xs text-muted-foreground">Super-admin access only</p>
        </CardFooter>
      </Card>
    </div>
  )
}
