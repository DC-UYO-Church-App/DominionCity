import type React from "react"
import type { Metadata } from "next/dist/lib/metadata/types/metadata-interface"
import { Fraunces, Hanken_Grotesk, Poppins } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"

// Brand type — Display = Fraunces (optical serif), Body/UI = Hanken Grotesk.
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-fraunces",
  display: "swap",
})

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
})

// Kept for any existing app pages that still reference `font-poppins`.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "Dominion City Uyo HQ - The wealthy place",
  description:
    "Dominion City — a contemporary church in Uyo. Find Sunday service times, plan your first visit, watch sermons, and give. A city set on a hill.",
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${hanken.variable} ${poppins.variable}`}
    >
      <head>
        {/* Set the JS hook before paint so reveal styles don't flash hidden content */}
        <Script id="js-hook" strategy="beforeInteractive">
          {`document.documentElement.classList.add('js');`}
        </Script>
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
          <SonnerToaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
