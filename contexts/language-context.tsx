"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type Language, getTranslations } from "@/lib/i18n"

interface LocationInfo {
  country: string
  countryCode: string
  ip: string
  flag: string
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: ReturnType<typeof getTranslations>
  locationInfo: LocationInfo | null
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

/**
 * Detecta el idioma basado en la IP del usuario
 * Solo Brasil es portugués, todo lo demás es español
 * Retorna el idioma y la información de ubicación
 */
async function detectLanguageFromIP(): Promise<{ language: Language; locationInfo: LocationInfo }> {
  if (typeof window === "undefined") {
    return {
      language: "es",
      locationInfo: {
        country: "Unknown",
        countryCode: "MX",
        ip: "unknown",
        flag: "🇲🇽",
      },
    }
  }
  
  try {
    const response = await fetch("/api/detect-language")
    if (response.ok) {
      const data = await response.json()
      return {
        language: data.language === "pt" ? "pt" : "es",
        locationInfo: {
          country: data.country || "Unknown",
          countryCode: data.countryCode || "MX",
          ip: data.ip || "unknown",
          flag: data.flag || "🇲🇽",
        },
      }
    }
  } catch (error) {
    console.error("Error detecting language from IP:", error)
  }
  
  // Fallback: usar español por defecto
  return {
    language: "es",
    locationInfo: {
      country: "Unknown",
      countryCode: "MX",
      ip: "unknown",
      flag: "🇲🇽",
    },
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Inicializar con detección automática (pero consistente en SSR)
  const [language, setLanguageState] = useState<Language>("es")
  const [t, setT] = useState(getTranslations("es"))
  const [mounted, setMounted] = useState(false)
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null)

  useEffect(() => {
    // Solo después de montar en el cliente
    setMounted(true)
    
    // Verificar si hay un idioma guardado en localStorage
    // Si existe, usarlo (el usuario ya eligió manualmente)
    const savedLang = localStorage.getItem("language") as Language
    if (savedLang && (savedLang === "pt" || savedLang === "es")) {
      setLanguageState(savedLang)
      setT(getTranslations(savedLang))
      // Intentar obtener info de ubicación aunque ya tengamos idioma guardado
      detectLanguageFromIP().then((result) => {
        setLocationInfo(result.locationInfo)
      }).catch(() => {
        // Ignorar errores si ya tenemos idioma guardado
      })
      return
    }
    
    // Si no hay idioma guardado, detectar automáticamente por IP
    // Solo Brasil es portugués, todo lo demás es español
    detectLanguageFromIP().then((result) => {
      setLanguageState(result.language)
      setT(getTranslations(result.language))
      setLocationInfo(result.locationInfo)
      // Guardar el idioma detectado para que no cambie en futuras visitas
      localStorage.setItem("language", result.language)
    }).catch((error) => {
      console.error("Error detecting language:", error)
      // En caso de error, usar español por defecto
      const defaultLang: Language = "es"
      setLanguageState(defaultLang)
      setT(getTranslations(defaultLang))
      setLocationInfo({
        country: "Unknown",
        countryCode: "MX",
        ip: "error",
        flag: "🇲🇽",
      })
      localStorage.setItem("language", defaultLang)
    })
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    setT(getTranslations(lang))
    if (typeof window !== "undefined") {
      localStorage.setItem("language", lang)
    }
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t, locationInfo }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
