"use client"

import { CheckCircle2, Home } from "lucide-react"
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
              <CheckCircle2 className="h-16 w-16 text-secondary-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-balance">{t.thankYou.title}</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">{t.thankYou.description}</p>
          </div>

          <div className="pt-4">
            <Button asChild size="lg" className="w-full">
              <Link href="https://migraflix.com" target="_blank" rel="noopener noreferrer">
                <Home className="mr-2 h-4 w-4" />
                {t.thankYou.button}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
