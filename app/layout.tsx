import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import Image from "next/image"
import Link from "next/link"
import "./globals.css"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import { LanguageProvider } from "@/contexts/language-context"
import { SentryInit } from "@/components/sentry-init"

export const metadata: Metadata = {
  title: "ChefIAndo",
  description: "Creado por Migraflix por Gabriel",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <SentryInit />
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center px-4">
            <Link href="/">
              <Image
                src="/chefiando.png"
                alt="ChefIAndo"
                width={160}
                height={50}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </div>
        </header>
        <LanguageProvider>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
          <Analytics />
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  )
}
