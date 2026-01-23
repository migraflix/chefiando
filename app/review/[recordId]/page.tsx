"use client"

import { use } from "react"
import { ReviewContent } from "@/components/review-content"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/language-selector"

export default function ReviewPage({
  params,
}: {
  params: Promise<{ recordId: string }>
}) {
  const { recordId } = use(params)
  const { t } = useLanguage()

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">{t.review.pageTitle}</h1>
            <p className="text-muted-foreground text-lg">{t.review.pageSubtitle}</p>
          </div>
        
        </div>
        <ReviewContent recordId={recordId} />
      </div>
    </main>
  )
}
