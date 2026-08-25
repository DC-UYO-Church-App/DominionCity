"use client"

import { useState } from "react"
import Link from "next/link"
import { MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  /* The server answers the same way whether or not the address has an account,
     so success here means "the request was accepted", not "an email exists". */
  const [sentMessage, setSentMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const response = await apiClient.forgotPassword(email.trim())
      setSentMessage(
        response?.message ||
          "If that email address has an account, a reset link is on its way.",
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the reset link. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 shadow-2xl backdrop-blur-sm">
        <CardHeader className="items-center space-y-2 text-center">
          <div className="mb-2 flex items-center justify-center">
            <img src="/logo.png" alt="Dominion City" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl text-[#0E1330]">Forgot Password</CardTitle>
          <CardDescription>
            {sentMessage ? "Check your inbox" : "We will email you a reset link."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {sentMessage ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <MailCheck className="h-7 w-7 text-emerald-600" />
              </div>
              <p className="text-sm leading-relaxed text-gray-600">{sentMessage}</p>
              <p className="text-xs text-gray-400">
                The link expires in 60 minutes and can only be used once.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSentMessage("")
                  setEmail("")
                }}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#0E1330] text-white hover:bg-[#070A1C] disabled:opacity-60"
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="text-[#0E1330] hover:underline">
              Back to login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
