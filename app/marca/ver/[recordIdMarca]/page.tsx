"use client"

import { use } from "react"
import { BrandContentTable } from "@/components/brand-content-table"
import { useLanguage } from "@/contexts/language-context"

export default function BrandPage({
  params,
}: {
  params: Promise<{ recordIdMarca: string }>
}) {
  const { recordIdMarca } = use(params)
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">{t.brand.title}</h1>
        </div>
        <BrandContentTable recordIdMarca={recordIdMarca} />
      </div>
    </div>
  )
}
