"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Languages } from "lucide-react"

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage()
  const [mounted, setMounted] = useState(false)

  // Evitar mismatch de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  // Durante SSR y antes de montar, usar un valor por defecto consistente
  const displayLanguage = mounted ? language : "es"

  return (
    <div className="flex items-center gap-2 bg-card border rounded-lg p-1">
      <Languages className="h-4 w-4 text-muted-foreground ml-2" />
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
