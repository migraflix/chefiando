"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
// All icons replaced with inline SVGs - no lucide-react dependency
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
          // Mostrar TODOS los contenidos, no solo los que tienen Post
          setContentItems(contents)
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
          <svg className="h-8 w-8 animate-spin text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p className="text-gray-600" suppressHydrationWarning>{t.brand.loading}</p>
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

  // Función para obtener el estado visual y el color según el Status
  const getStatusInfo = (status: string | undefined) => {
    if (!status) {
      return {
        label: t.brand.status.creating,
        color: "bg-blue-100 text-blue-800",
        icon: () => (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
        ),
        description: t.brand.status.creatingDescription,
        isProcessing: true,
      }
    }

    const statusLower = status.toLowerCase()
    
    // Detectar "creando publicación" o "creando publicacion" (con o sin tilde)
    if (statusLower.includes("creando publicación") || statusLower.includes("creando publicacion") || 
        statusLower.includes("creating post") || statusLower.includes("creating publication")) {
      return {
        label: t.brand.status.creatingPost,
        color: "bg-purple-100 text-purple-800",
        icon: () => (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        description: t.brand.status.creatingPostDescription,
        isProcessing: true,
      }
    }
    
    // Detectar "creando imagen"
    if (statusLower.includes("creando imagen") || statusLower.includes("creating image")) {
      return {
        label: t.brand.status.creatingImage,
        color: "bg-blue-100 text-blue-800",
        icon: () => <Image src="/placeholder.svg" alt="creating image" width={16} height={16} />,
        description: t.brand.status.creatingImageDescription,
        isProcessing: true,
      }
    }
    
    // Detectar otros estados de creación/procesamiento
    if (statusLower.includes("creando") || statusLower.includes("creating") || 
        statusLower.includes("procesando") || statusLower.includes("processing") ||
        statusLower.includes("generando") || statusLower.includes("generating")) {
      if (statusLower.includes("imagen") || statusLower.includes("image")) {
        return {
          label: t.brand.status.creatingImage,
          color: "bg-blue-100 text-blue-800",
          icon: () => <Image src="/placeholder.svg" alt="creating image" width={16} height={16} />,
          description: t.brand.status.creatingImageDescription,
          isProcessing: true,
        }
      }
      if (statusLower.includes("publicación") || statusLower.includes("publicacion") || 
          statusLower.includes("post") || statusLower.includes("contenido") || 
          statusLower.includes("content")) {
        return {
          label: t.brand.status.creatingPost,
          color: "bg-purple-100 text-purple-800",
          icon: () => (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
          description: t.brand.status.creatingPostDescription,
          isProcessing: true,
        }
      }
      return {
        label: t.brand.status.creating,
        color: "bg-blue-100 text-blue-800",
        icon: () => (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
        ),
        description: t.brand.status.creatingDescription,
        isProcessing: true,
      }
    }

    if (statusLower.includes("revisar") || statusLower.includes("review") || 
        statusLower.includes("pending") || statusLower.includes("manual review")) {
      return {
        label: t.brand.status.pendingReview,
        color: "bg-yellow-100 text-yellow-800",
        icon: () => (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        ),
        description: t.brand.status.pendingReviewDescription,
        isProcessing: false,
      }
    }

    if (statusLower.includes("revisado") || statusLower.includes("reviewed") || 
        statusLower.includes("approved") || statusLower.includes("aprobado")) {
      return {
        label: t.brand.status.reviewed,
        color: "bg-green-100 text-green-800",
        icon: () => (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        description: t.brand.status.reviewedDescription,
        isProcessing: false,
      }
    }

    return {
      label: status,
      color: "bg-gray-100 text-gray-800",
      icon: () => (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12,6 12,12 16,14" />
        </svg>
      ),
      description: status,
      isProcessing: false,
    }
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

              <Button asChild className="mt-4 bg-orange-500 hover:bg-orange-600">
                <a href={`/fotos?marca=${recordIdMarca}`}>
                  {t.brand.uploadPhotos}
                </a>
              </Button>
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
        {/* Vista Desktop: Tabla completa */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t.brand.table.image}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t.brand.table.post}</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">{t.brand.table.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contentItems.map((item) => {
                const statusInfo = getStatusInfo(item.fields.Status)
                const StatusIcon = statusInfo.icon
                const hasPost = item.fields.Post && item.fields.Post.trim() !== ""
                const hasImage = item.fields["📥 Image"]?.[0]?.url
                const isProcessing = statusInfo.isProcessing || false
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="space-y-3">
                    {hasImage ? (
                      <div className="space-y-2">
                        <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100 shadow-md">
                          <Image
                            src={item.fields["📥 Image"]?.[0]?.url || "/placeholder.svg"}
                            alt="Imagen del post"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <a
                          href={item.fields["📥 Image"]?.[0]?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 underline break-all block max-w-32"
                        >
                          📥 Image url
                        </a>
                      </div>
                        ) : isProcessing ? (
                          <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center shadow-md">
                            <svg className="h-6 w-6 text-blue-500 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center shadow-md">
                            <span className="text-gray-400 text-xs">{t.brand.table.noImage}</span>
                          </div>
                        )}
                        {/* Botón de Review debajo de la foto en desktop también */}
                        {hasPost ? (
                          <Link href={`/review/${item.id}?brandId=${recordIdMarca}`}>
                            <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                              {t.brand.table.rate}
                            </Button>
                          </Link>
                        ) : (
                          <div className="text-xs text-gray-400 text-center py-2">
                            {t.brand.status.waiting}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      {hasPost ? (
                        <p className="text-gray-600 text-sm line-clamp-3">{item.fields.Post}</p>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <StatusIcon />
                          <span>{statusInfo.description}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 ${statusInfo.color} text-xs font-medium rounded-full`}>
                          {isProcessing && <svg className="h-3 w-3 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>}
                          {!isProcessing && <StatusIcon />}
                          {statusInfo.label}
                        </span>
                        {item.fields.Status && item.fields.Status !== statusInfo.label && (
                          <span className="text-xs text-gray-500">{item.fields.Status}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Vista Mobile: Foto y botón primero */}
        <div className="md:hidden">
          <div className="divide-y divide-gray-200">
            {contentItems.map((item) => {
              const statusInfo = getStatusInfo(item.fields.Status)
              const StatusIcon = statusInfo.icon
              const hasPost = item.fields.Post && item.fields.Post.trim() !== ""
              const hasImage = item.fields["📥 Image"]?.[0]?.url
              const isProcessing = statusInfo.isProcessing || false
              
              return (
                <div key={item.id} className="p-4 space-y-4">
                  {/* Foto - Primero en móvil */}
                  <div className="flex flex-col items-center">
                    {hasImage ? (
                      <div className="space-y-2 flex flex-col items-center">
                        <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100 shadow-md">
                          <Image
                            src={item.fields["📥 Image"]?.[0]?.url || "/placeholder.svg"}
                            alt="Imagen del post"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <a
                          href={item.fields["📥 Image"]?.[0]?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 underline break-all text-center max-w-48"
                        >
                          📥 Image url
                        </a>
                      </div>
                    ) : isProcessing ? (
                      <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center shadow-md">
                        <svg className="h-8 w-8 text-blue-500 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center shadow-md">
                        <span className="text-gray-400 text-xs text-center px-2">{t.brand.table.noImage}</span>
                      </div>
                    )}
                  </div>

                  {/* Botón de Review - Debajo de la foto */}
                  <div>
                    {hasPost ? (
                      <Link href={`/review/${item.id}?brandId=${recordIdMarca}`} className="block">
                        <Button size="lg" className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {t.brand.table.rate}
                        </Button>
                      </Link>
                    ) : (
                      <div className="text-sm text-gray-400 text-center py-2">
                        {t.brand.status.waiting}
                      </div>
                    )}
                  </div>

                  {/* Post y Status - Después en móvil */}
                  <div className="space-y-2">
                    {hasPost && (
                      <div>
                        <p className="text-gray-600 text-sm line-clamp-2">{item.fields.Post}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <StatusIcon />
                        <span>{statusInfo.description}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 ${statusInfo.color} text-xs font-medium rounded-full`}>
                        {isProcessing && <svg className="h-3 w-3 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>}
                        {!isProcessing && <StatusIcon />}
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>
    </div>
  )
}
