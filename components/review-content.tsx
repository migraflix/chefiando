"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { StarRating } from "@/components/star-rating"
import { AlertCircle, Image, Utensils, Video, Download } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import confetti from "canvas-confetti"
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"
import { noCacheUrl } from "@/lib/utils"

interface AirtableRecord {
  id: string;
  fields: {
    Title?: string;
    Post?: string;
    "📥 Image"?: Array<{ url: string; thumbnails?: { large?: { url: string } } }>;
    "📥 Video"?: Array<{ url: string }>;
    "Calificación Post"?: number;
    "Calificación Imagen"?: number;
    "Comentarios Post"?: string;
    "Comentario Imagen"?: string;
    Status?: string;
    "Fotos AI"?: Array<string>;
    "Imagen Original"?: Array<{ url: string; thumbnails?: { large?: { url: string } } }>;
  };
  aiPhoto?: {
    id: string;
    fields: {
      Nombre?: string;
      Precio?: number;
      Ingredientes?: string;
      Imagen?: Array<{ url: string }>;
    };
  };
}

export function ReviewContent({ recordId }: { recordId: string }) {
  const { t } = useLanguage()

  const [record, setRecord] = useState<AirtableRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [postRating, setPostRating] = useState(0)
  const [imageRating, setImageRating] = useState(0)
  const [postComment, setPostComment] = useState("")
  const [imageComment, setImageComment] = useState("")
  
  const [dishName, setDishName] = useState("")
  const [dishPrice, setDishPrice] = useState("")
  const [dishIngredients, setDishIngredients] = useState("")

  // Video generation modal state
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [videoInstructions, setVideoInstructions] = useState("")
  const [sendingVideo, setSendingVideo] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const brandId = searchParams.get("brandId")
  const { toast } = useToast()

  useEffect(() => {
    fetchRecord()
  }, [recordId])

  const fetchRecord = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/airtable/${recordId}`)

      if (!response.ok) {
        throw new Error("Error al cargar el registro")
      }

      const data = await response.json()
      setRecord(data)

      // Cargar valores existentes
      setPostRating(data.fields["Calificación Post"] || 0)
      setImageRating(data.fields["Calificación Imagen"] || 0)
      setPostComment(data.fields["Comentarios Post"] || "")
      setImageComment(data.fields["Comentario Imagen"] || "")
      
      if (data.aiPhoto) {
        setDishName(data.aiPhoto.fields["Nombre"] || "")
        setDishPrice(data.aiPhoto.fields["Precio"]?.toString() || "")
        setDishIngredients(data.aiPhoto.fields["Ingredientes"] || "")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (statusOverride?: string) => {
    const isApprove = statusOverride === "Approved"
    try {
      if (isApprove) {
        setApproving(true)
      } else {
        setSaving(true)
      }
      setError(null)

      const updateData: Record<string, any> = {
        "Calificación Post": postRating,
        "Calificación Imagen": imageRating,
        "Comentarios Post": postComment,
        "Comentario Imagen": imageComment,
        Status: statusOverride ?? "Revisado",
      }

      if (dishName.trim()) {
        updateData["Nombre"] = dishName
      }
      if (dishPrice.trim()) {
        updateData["Precio"] = parseFloat(dishPrice)
      }
      if (dishIngredients.trim()) {
        updateData["Ingredientes"] = dishIngredients
      }

      const response = await fetch(`/api/airtable/${recordId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: updateData,
          brandId: brandId,
          contentId: recordId,
          aiPhotoId: record?.aiPhoto?.id
        }),
      })

      if (!response.ok) {
        throw new Error("Error al guardar las calificaciones")
      }

      toast({
        title: isApprove ? t.review.approveSuccess.title : t.review.success.title,
        description: isApprove ? t.review.approveSuccess.description : t.review.success.description,
      })

      // Brazilian confetti colors (green, yellow, blue)
      const colors = ["#009c3b", "#ffdf00", "#002776"]

      // Fire confetti from multiple angles
      const duration = 3000
      const animationEnd = Date.now() + duration

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          clearInterval(interval)
          if (brandId) {
            router.push(`/marca/ver/${brandId}`)
          } else {
            router.push("/")
          }
          return
        }

        const particleCount = 50 * (timeLeft / duration)

        confetti({
          particleCount,
          startVelocity: 30,
          spread: 360,
          origin: {
            x: randomInRange(0.1, 0.3),
            y: Math.random() - 0.2,
          },
          colors: colors,
        })

        confetti({
          particleCount,
          startVelocity: 30,
          spread: 360,
          origin: {
            x: randomInRange(0.7, 0.9),
            y: Math.random() - 0.2,
          },
          colors: colors,
        })
      }, 250)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
      setApproving(false)
    }
  }

  const handleApprove = () => handleSave("Approved")

  // ============================================
  // WEBHOOK VIDEO GENERATION
  // URL: https://n8n.migraflix.com/webhook/cceb22a2-cfe8-4cf5-a705-ed31de1854b7
  // ============================================
  const handleGenerateVideo = async () => {
    try {
      setSendingVideo(true)
      setError(null)

      const response = await fetch(
        "https://n8n.migraflix.com/webhook/cceb22a2-cfe8-4cf5-a705-ed31de1854b7",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recordId: recordId,
            instructions: videoInstructions,
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Error al enviar la solicitud")
      }

      toast({
        title: t.review.video.success.title,
        description: t.review.video.success.description,
      })

      setVideoModalOpen(false)
      setVideoInstructions("")
    } catch (err) {
      toast({
        title: t.review.video.error.title,
        description: t.review.video.error.description,
        variant: "destructive",
      })
    } finally {
      setSendingVideo(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner className="mx-auto mb-4" />
          <p className="text-muted-foreground">{t.review.loading}</p>
        </div>
      </div>
    )
  }

  if (error && !record) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!record) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{t.review.notFound}</AlertDescription>
      </Alert>
    )
  }

  const imageUrl = noCacheUrl(record.fields["📥 Image"]?.[0]?.url, record.id)
  // Usar thumbnail large para Imagen Original (más compatible con iOS)
  const originalImageUrl = noCacheUrl(
    record.fields["Imagen Original"]?.[0]?.thumbnails?.large?.url || record.fields["Imagen Original"]?.[0]?.url,
    record.id
  )
  // Video URL
  const videoUrl = record.fields["📥 Video"]?.[0]?.url

  return (
    <div className="space-y-6">

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {record.fields.Status === "Approved" && (
        <Card className="border-green-500/40 bg-green-50">
          <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
            <div className="flex items-center gap-2 text-green-800">
              <Download className="h-5 w-5" />
              <span className="font-medium">{t.review.downloadReady}</span>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-green-600 text-green-700 hover:bg-green-100 hover:text-green-800"
            >
              <a href={`/review/d?rec=${record.id}`}>
                <Download className="mr-2 h-4 w-4" />
                {t.review.downloadButton}
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {record.fields.Title && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-balance">{record.fields.Title}</CardTitle>
          </CardHeader>
        </Card>
      )}

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Utensils className="h-5 w-5" />
            {t.review.aiPhoto.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Imagen Original</Label>
              {originalImageUrl ? (
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted border">
                  <img src={originalImageUrl || "/placeholder.svg"} alt="Imagen Original" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-square rounded-lg bg-muted flex items-center justify-center border border-dashed">
                  <p className="text-muted-foreground text-sm">No original photo</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">ChefIAndo Generated</Label>
              {imageUrl ? (
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted border">
                  <img src={imageUrl || "/placeholder.svg"} alt="AI Generated" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-square rounded-lg bg-muted flex items-center justify-center border border-dashed">
                  <p className="text-muted-foreground text-sm">No generated photo</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dish-name">{t.review.aiPhoto.name}</Label>
              <Input
                id="dish-name"
                placeholder={t.review.aiPhoto.namePlaceholder}
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dish-price">{t.review.aiPhoto.price}</Label>
              <Input
                id="dish-price"
                type="number"
                step="0.01"
                min="0"
                placeholder={t.review.aiPhoto.pricePlaceholder}
                value={dishPrice}
                onChange={(e) => setDishPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dish-ingredients">{t.review.aiPhoto.ingredients}</Label>
            <Textarea
              id="dish-ingredients"
              placeholder={t.review.aiPhoto.ingredientsPlaceholder}
              value={dishIngredients}
              onChange={(e) => setDishIngredients(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Video Card - only show if video exists */}
      {videoUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              {t.review.video.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border">
              <video
                src={videoUrl}
                controls
                className="w-full h-full object-contain"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              {t.review.image.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {imageUrl ? (
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted border mb-4">
                <img
                  src={imageUrl || "/placeholder.svg"}
                  alt={t.review.aiPhoto.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square rounded-lg bg-muted flex items-center justify-center border border-dashed mb-4">
                <p className="text-muted-foreground text-sm">No generated photo</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>{t.review.image.rating}</Label>
              <StarRating rating={imageRating} onRatingChange={setImageRating} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image-comment">{t.review.image.comment}</Label>
              <Textarea
                id="image-comment"
                placeholder={t.review.image.commentPlaceholder}
                value={imageComment}
                onChange={(e) => setImageComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.review.post.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg min-h-[200px]">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {record.fields.Post || t.review.post.noContent}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t.review.post.rating}</Label>
              <StarRating rating={postRating} onRatingChange={setPostRating} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-comment">{t.review.post.comment}</Label>
              <Textarea
                id="post-comment"
                placeholder={t.review.post.commentPlaceholder}
                value={postComment}
                onChange={(e) => setPostComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        {/* Only show Generate Video button if no video exists */}
        {!videoUrl && (
          <Button
            size="lg"
            variant="outline"
            onClick={() => setVideoModalOpen(true)}
            className="min-w-[200px] border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
          >
            <Video className="mr-2 h-4 w-4" />
            {t.review.video.generate}
          </Button>
        )}
        <Button size="lg" onClick={() => handleSave()} disabled={saving || approving} className="min-w-[200px]">
          {saving ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              {t.review.saving}
            </>
          ) : (
            t.review.save
          )}
        </Button>
        <Button
          size="lg"
          onClick={handleApprove}
          disabled={saving || approving}
          className="min-w-[200px] bg-green-600 hover:bg-green-700 text-white"
        >
          {approving ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              {t.review.approving}
            </>
          ) : (
            t.review.approve
          )}
        </Button>
      </div>

      {/* Video Generation Modal */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              {t.review.video.generate}
            </DialogTitle>
            <DialogDescription>
              {t.review.video.instructions}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder={t.review.video.instructionsPlaceholder}
              value={videoInstructions}
              onChange={(e) => setVideoInstructions(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVideoModalOpen(false)}
              disabled={sendingVideo}
            >
              {t.review.video.cancel}
            </Button>
            <Button
              onClick={handleGenerateVideo}
              disabled={sendingVideo || !videoInstructions.trim()}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {sendingVideo ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {t.review.video.sending}
                </>
              ) : (
                t.review.video.send
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
