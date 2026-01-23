"use client"

// Using inline SVGs for check and home icons
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/language-selector"

export default function ThankYouPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      <Card className="max-w-md w-full">
        <CardContent className="pt-12 pb-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-secondary p-6">
              <svg className="h-16 w-16 text-secondary-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-balance">{t.thankYou.title}</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">{t.thankYou.description}</p>
          </div>

          <div className="pt-4">
            <Button asChild size="lg" className="w-full">
              <Link href="https://migraflix.com" target="_blank" rel="noopener noreferrer">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {t.thankYou.button}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
