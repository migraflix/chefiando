"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/language-selector"

interface ContentItem {
  id: string
  fields: {
    Post?: string
    "📥 Image"?: Array<{ url: string }>
    Title?: string
    Status?: string
    "Prompt Image"?: string // Fixed syntax error - property name with space must be in quotes
  }
}

interface BrandData {
  id: string
  fields: {
    Content?: string[]
    Negocio?: string
    Description?: string
    Category?: string
    Location?: string
    "Upload Fotos Link"?: string
    [key: string]: any
  }
}

export function BrandContentTable({ recordIdMarca }: { recordIdMarca: string }) {
  const [brandData, setBrandData] = useState<BrandData | null>(null)
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useLanguage()

  useEffect(() => {
    async function fetchBrandAndContent() {
      try {
        setLoading(true)

        // Fetch brand data
        const brandResponse = await fetch(`/api/brands/${recordIdMarca}`)
        if (!brandResponse.ok) throw new Error("Error al cargar la marca")

        const brand = await brandResponse.json()
        setBrandData(brand)

        // Fetch all content items if Content array exists
        if (brand.fields.Content && Array.isArray(brand.fields.Content)) {
          const response = await fetch("/api/content/batch", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ids: brand.fields.Content }),
          })

          if (!response.ok) throw new Error("Error al cargar el contenido")

          const data = await response.json()
          const contents = data.records || []
          const filteredContents = contents.filter(
            (item: ContentItem) => item.fields.Post && item.fields.Post.trim() !== "",
          )
          setContentItems(filteredContents)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    fetchBrandAndContent()
  }, [recordIdMarca])

  if (loading) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-gray-600">{t.brand.loading}</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">{t.brand.error}</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </Card>
    )
  }

  if (!contentItems.length) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <p className="text-gray-600">{t.brand.noContent}</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <LanguageSelector />
      </div>

      {brandData && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-8 border border-orange-100">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {brandData.fields.Negocio || "Marca sin nombre"}
                </h2>
                {brandData.fields.Category && (
                  <span className="inline-block px-3 py-1 bg-orange-500 text-white text-sm font-medium rounded-full">
                    {brandData.fields.Category}
                  </span>
                )}
              </div>

              {brandData.fields.Description && (
                <p className="text-gray-700 text-lg max-w-2xl">{brandData.fields.Description}</p>
              )}

              {brandData.fields.Location && (
                <p className="text-gray-600 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {brandData.fields.Location}
                </p>
              )}

              {brandData.fields["Upload Fotos Link"] && (
                <Button asChild className="mt-4 bg-orange-500 hover:bg-orange-600">
                  <a href={brandData.fields["Upload Fotos Link"]} target="_blank" rel="noopener noreferrer">
                    {t.brand.uploadPhotos}
                  </a>
                </Button>
              )}
            </div>

            <div className="text-right">
              <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-orange-200">
                <p className="text-sm text-gray-600 mb-1">{t.brand.totalPosts}</p>
                <p className="text-3xl font-bold text-orange-500">{contentItems.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t.brand.table.image}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t.brand.table.post}</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">{t.brand.table.status}</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">{t.brand.table.rate}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contentItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    {item.fields["📥 Image"]?.[0]?.url ? (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={item.fields["📥 Image"][0].url || "/placeholder.svg"}
                          alt="Imagen del post"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">{t.brand.table.noImage}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 max-w-md">
                    <p className="text-gray-600 text-sm line-clamp-3">{item.fields.Post || t.brand.table.noContent}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      {item.fields.Status || t.brand.table.noStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link href={`/review/${item.id}?brandId=${recordIdMarca}`}>
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {t.brand.table.rate}
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
