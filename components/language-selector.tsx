"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Languages } from "lucide-react"

export function LanguageSelector() {
  const { language, setLanguage, locationInfo } = useLanguage()
  const [mounted, setMounted] = useState(false)

  // Evitar mismatch de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  // Durante SSR y antes de montar, usar un valor por defecto consistente
  const displayLanguage = mounted ? language : "pt"
  const flag = locationInfo?.flag || (language === "pt" ? "🇧🇷" : "🇲🇽")
  const isDevelopment = typeof window !== "undefined" && window.location.hostname === "localhost"

  return (
    <div className="flex items-center gap-2 bg-card border rounded-lg p-1">
      <Languages className="h-4 w-4 text-muted-foreground ml-2" />
      {/* Bandera y IP para debug (solo en desarrollo/localhost) */}
      {isDevelopment && mounted && locationInfo && (
        <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs" title={`IP: ${locationInfo.ip} | País: ${locationInfo.country} (${locationInfo.countryCode})`}>
          <span className="text-lg">{flag}</span>
          <span className="text-muted-foreground font-mono">
            {locationInfo.ip !== "unknown" && locationInfo.ip !== "error" && !locationInfo.ip.startsWith("192.168.") && !locationInfo.ip.startsWith("127.0.0.1")
              ? locationInfo.ip.substring(0, 10) + "..." 
              : locationInfo.countryCode || locationInfo.country}
          </span>
        </div>
      )}
      {/* Bandera en producción (sin IP) */}
      {(!isDevelopment || !mounted) && (
        <span className="text-lg">{flag}</span>
      )}
      <Button
        variant={displayLanguage === "pt" ? "default" : "ghost"}
        size="sm"
        onClick={() => setLanguage("pt")}
        className="text-xs"
      >
        PT
      </Button>
      <Button
        variant={displayLanguage === "es" ? "default" : "ghost"}
        size="sm"
        onClick={() => setLanguage("es")}
        className="text-xs"
      >
        ES
      </Button>
    </div>
  )
}
