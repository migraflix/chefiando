"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Loader2, Filter } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/language-selector"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ContentItem {
  id: string
  brandId: string
  brandName: string
  fields: {
    Post?: string
    "📥 Image"?: Array<{ url: string }>
    Title?: string
    Status?: string
    "Prompt Image"?: string
  }
}

export function AllContentTable({ status }: { status: "pending" | "reviewed" }) {
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [filteredItems, setFilteredItems] = useState<ContentItem[]>([])
  const [selectedBrand, setSelectedBrand] = useState<string>("all")
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useLanguage()

  useEffect(() => {
    async function fetchAllContent() {
      try {
        setLoading(true)
        const [contentResponse, brandsResponse] = await Promise.all([
          fetch(`/api/content/all?status=${status}`),
          fetch("/api/brands"),
        ])

        if (!contentResponse.ok) throw new Error("Error al cargar el contenido")
        if (!brandsResponse.ok) throw new Error("Error al cargar las marcas")

        const contentData = await contentResponse.json()
        const brandsData = await brandsResponse.json()

        setContentItems(contentData.content)
        setFilteredItems(contentData.content)

        const allBrands = brandsData.records.map((record: any) => ({
          id: record.id,
          name: record.fields.Negocio || "Sin nombre",
        }))
        setBrands(allBrands)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    fetchAllContent()
  }, [status])

  useEffect(() => {
    if (selectedBrand === "all") {
      setFilteredItems(contentItems)
    } else {
      setFilteredItems(contentItems.filter((item) => item.brandId === selectedBrand))
    }
  }, [selectedBrand, contentItems])

  const pageTitle =
    status === "pending"
      ? t.lang === "pt"
        ? "Conteúdo para Revisar"
        : "Contenido para Revisar"
      : t.lang === "pt"
        ? "Conteúdo Revisado"
        : "Contenido Revisado"

  const pageSubtitle =
    status === "pending"
      ? t.lang === "pt"
        ? "Publicações pendentes de revisão manual"
        : "Publicaciones pendientes de revisión manual"
      : t.lang === "pt"
        ? "Publicações já revisadas ou aprovadas"
        : "Publicaciones ya revisadas o aprobadas"

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-white p-8">
        <Card className="p-12 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <p className="text-gray-600">{t.brand.loading}</p>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-white p-8">
        <Card className="p-12 max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-2">{t.brand.error}</p>
            <p className="text-gray-600">{error}</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{t.brand.title}</h1>
            <p className="text-gray-600">{pageTitle}</p>
          </div>
          <LanguageSelector />
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-8 border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{pageTitle}</h2>
              <p className="text-gray-700">{pageSubtitle}</p>
            </div>
            <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-orange-200">
              <p className="text-sm text-gray-600 mb-1">{t.brand.totalPosts}</p>
              <p className="text-3xl font-bold text-orange-500">{filteredItems.length}</p>
            </div>
          </div>
        </div>

        {/* Brand Filter */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                {t.lang === "pt" ? "Filtrar por marca" : "Filtrar por marca"}
              </label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder={t.lang === "pt" ? "Todas as marcas" : "Todas las marcas"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.lang === "pt" ? "Todas as marcas" : "Todas las marcas"}</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {filteredItems.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <p className="text-gray-600">{t.brand.noContent}</p>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      {t.lang === "pt" ? "Marca" : "Marca"}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t.brand.table.image}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t.brand.table.post}</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      {t.lang === "pt" ? "Ações" : "Acciones"}
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      {t.brand.table.status}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          href={`/marca/ver/${item.brandId}`}
                          className="text-orange-600 hover:text-orange-700 font-medium hover:underline"
                        >
                          {item.brandName}
                        </Link>
                      </td>
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
                        <p className="text-gray-600 text-sm line-clamp-3">
                          {item.fields.Post || t.brand.table.noContent}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link href={`/review/${item.id}?brandId=${item.brandId}`}>
                          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {status === "pending" ? t.brand.table.rate : t.lang === "pt" ? "Ver" : "Ver"}
                          </Button>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                            item.fields.Status === "Manual Review"
                              ? "bg-yellow-100 text-yellow-800"
                              : item.fields.Status === "Approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {item.fields.Status || t.brand.table.noStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
