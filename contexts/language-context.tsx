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
    
    // SIEMPRE detectar primero el idioma por IP
    detectLanguageFromIP().then((result) => {
      setLocationInfo(result.locationInfo)
      
      // Verificar si el usuario ya eligió manualmente el idioma
      const userManuallyChanged = localStorage.getItem("language_manually_changed") === "true"
      const savedLang = localStorage.getItem("language") as Language
      
      if (userManuallyChanged && savedLang && (savedLang === "pt" || savedLang === "es")) {
        // El usuario cambió manualmente el idioma, respetar su elección
        console.log("🌐 Usando idioma manual:", savedLang)
        setLanguageState(savedLang)
        setT(getTranslations(savedLang))
      } else {
        // Usar el idioma detectado por IP (sobrescribe cualquier idioma guardado anterior)
        console.log("🌐 Usando idioma detectado por IP:", result.language, "País:", result.locationInfo.country)
        setLanguageState(result.language)
        setT(getTranslations(result.language))
        // Guardar el idioma detectado
        localStorage.setItem("language", result.language)
        // Asegurar que NO está marcado como cambio manual
        localStorage.removeItem("language_manually_changed")
      }
    }).catch((error) => {
      console.error("Error detecting language:", error)
      // En caso de error, verificar si hay idioma guardado
      const savedLang = localStorage.getItem("language") as Language
      if (savedLang && (savedLang === "pt" || savedLang === "es")) {
        setLanguageState(savedLang)
        setT(getTranslations(savedLang))
      } else {
        // Usar español por defecto
        const defaultLang: Language = "es"
        setLanguageState(defaultLang)
        setT(getTranslations(defaultLang))
        localStorage.setItem("language", defaultLang)
      }
      setLocationInfo({
        country: "Unknown",
        countryCode: "MX",
        ip: "error",
        flag: "🇲🇽",
      })
    })
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    setT(getTranslations(lang))
    if (typeof window !== "undefined") {
      localStorage.setItem("language", lang)
      // Marcar que el usuario cambió manualmente el idioma
      localStorage.setItem("language_manually_changed", "true")
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
