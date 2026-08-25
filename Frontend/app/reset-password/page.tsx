"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"

const MIN_PASSWORD_LENGTH = 8

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") || ""

  // null while the token is being checked, so we don't flash the wrong screen.
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    if (!token) {
      setIsTokenValid(false)
      return
    }

    let cancelled = false
    apiClient
      .verifyResetToken(token)
      .then((response) => {
        if (!cancelled) setIsTokenValid(Boolean(response?.valid))
      })
      .catch(() => {
        if (!cancelled) setIsTokenValid(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== confirmPassword) {
      setError("Those passwords do not match.")
      return
    }

    setIsSubmitting(true)
    try {
      await apiClient.resetPassword(token, password)
      setIsDone(true)
      // Give the reader a moment to see the confirmation before moving on.
      setTimeout(() => router.replace("/login"), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset your password. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isTokenValid === null) {
    return (
      <Card className="w-full max-w-md bg-white/95 shadow-2xl backdrop-blur-sm">
        <CardContent className="py-16 text-center text-sm text-gray-500">
          Checking your reset link...
        </CardContent>
      </Card>
    )
  }

  if (!isTokenValid) {
    return (
      <Card className="w-full max-w-md bg-white/95 shadow-2xl backdrop-blur-sm">
        <CardHeader className="items-center space-y-2 text-center">
          <div className="mb-2 flex items-center justify-center">
            <img src="/logo.png" alt="Dominion City" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl text-[#0E1330]">Link expired</CardTitle>
          <CardDescription>This reset link is no longer valid.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm leading-relaxed text-gray-600">
            Reset links last 60 minutes and can only be used once. Request a fresh one
            and we will email it straight over.
          </p>
          <Link href="/forgot-password" className="block">
            <Button className="w-full bg-[#0E1330] text-white hover:bg-[#070A1C]">
              Request a new link
            </Button>
          </Link>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login" className="text-sm text-[#0E1330] hover:underline">
            Back to login
          </Link>
        </CardFooter>
      </Card>
    )
  }

  if (isDone) {
    return (
      <Card className="w-full max-w-md bg-white/95 shadow-2xl backdrop-blur-sm">
        <CardContent className="space-y-4 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-[#0E1330]">Password updated</h2>
          <p className="text-sm text-gray-600">Taking you to the login page...</p>
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full">
              Go to login now
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md bg-white/95 shadow-2xl backdrop-blur-sm">
      <CardHeader className="items-center space-y-2 text-center">
        <div className="mb-2 flex items-center justify-center">
          <img src="/logo.png" alt="Dominion City" className="h-16 w-auto" />
        </div>
        <CardTitle className="text-2xl text-[#0E1330]">Choose a new password</CardTitle>
        <CardDescription>At least {MIN_PASSWORD_LENGTH} characters.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                className="pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-gray-400 transition-colors hover:text-[#0E1330]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#0E1330] text-white hover:bg-[#070A1C] disabled:opacity-60"
          >
            {isSubmitting ? "Updating..." : "Update password"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center">
        <Link href="/login" className="text-sm text-[#0E1330] hover:underline">
          Back to login
        </Link>
      </CardFooter>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-4">
      {/* useSearchParams needs a Suspense boundary to prerender this route. */}
      <Suspense
        fallback={
          <Card className="w-full max-w-md bg-white/95 shadow-2xl backdrop-blur-sm">
            <CardContent className="py-16 text-center text-sm text-gray-500">Loading...</CardContent>
          </Card>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
