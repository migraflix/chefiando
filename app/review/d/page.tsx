"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Download, CheckCircle2 } from "lucide-react"

type Status = "loading" | "downloading-image" | "downloading-video" | "done" | "error"

function triggerDownload(url: string) {
  const a = document.createElement("a")
  a.href = url
  a.rel = "noopener"
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export default function DownloadPage() {
  const searchParams = useSearchParams()
  const recordId = searchParams.get("rec")

  const [status, setStatus] = useState<Status>("loading")
  const [error, setError] = useState<string | null>(null)
  const [hasVideo, setHasVideo] = useState(false)

  useEffect(() => {
    if (!recordId) {
      setStatus("error")
      setError("Falta el parámetro ?rec=")
      return
    }

    let cancelled = false

    const run = async () => {
      try {
        const checkRes = await fetch(`/api/content/download/${recordId}?check=1`)
        if (!checkRes.ok) throw new Error("No se pudo consultar el registro")
        const info = await checkRes.json()
        if (cancelled) return

        if (!info.hasImage && !info.hasVideo) {
          setStatus("error")
          setError("Este registro no tiene imagen ni video")
          return
        }

        setHasVideo(!!info.hasVideo)

        if (info.hasImage) {
          setStatus("downloading-image")
          triggerDownload(`/api/content/download/${recordId}?type=image`)
        }

        if (info.hasVideo) {
          // Pequeña espera para que el navegador no descarte la segunda descarga
          await new Promise((r) => setTimeout(r, 1200))
          if (cancelled) return
          setStatus("downloading-video")
          triggerDownload(`/api/content/download/${recordId}?type=video`)
        }

        await new Promise((r) => setTimeout(r, 800))
        if (!cancelled) setStatus("done")
      } catch (err) {
        if (!cancelled) {
          setStatus("error")
          setError(err instanceof Error ? err.message : "Error desconocido")
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [recordId])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {status === "loading" && (
          <>
            <Spinner className="mx-auto" />
            <p className="text-muted-foreground">Preparando descarga…</p>
          </>
        )}

        {status === "downloading-image" && (
          <>
            <Spinner className="mx-auto" />
            <p className="text-foreground font-medium">Descargando imagen…</p>
          </>
        )}

        {status === "downloading-video" && (
          <>
            <Spinner className="mx-auto" />
            <p className="text-foreground font-medium">Descargando video…</p>
            <p className="text-muted-foreground text-sm">La imagen ya se descargó</p>
          </>
        )}

        {status === "done" && (
          <>
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
            <div>
              <p className="text-foreground font-medium">Descarga completada</p>
              <p className="text-muted-foreground text-sm">
                {hasVideo ? "Imagen y video descargados" : "Imagen descargada"}
              </p>
            </div>
            {recordId && (
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() =>
                    triggerDownload(`/api/content/download/${recordId}?type=image`)
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Imagen otra vez
                </Button>
                {hasVideo && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      triggerDownload(`/api/content/download/${recordId}?type=video`)
                    }
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Video otra vez
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {status === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </main>
  )
}
