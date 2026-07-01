"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export function SuperAdminLoginScreen() {
  const router = useRouter()
  const { toast } = useToast()
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
        toast({
          title: "Access denied",
          description: "You do not have super-admin privileges.",
          variant: "destructive",
        })
        return
      }
      router.push("/dashboard/admin")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed"
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
