"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type Language, getTranslations } from "@/lib/i18n"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: ReturnType<typeof getTranslations>
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

/**
 * Detecta el idioma basado en la IP del usuario
 * Solo Brasil es portugués, todo lo demás es español
 */
async function detectLanguageFromIP(): Promise<Language> {
  if (typeof window === "undefined") return "es" // Default para SSR
  
  try {
    const response = await fetch("/api/detect-language")
    if (response.ok) {
      const data = await response.json()
      return data.language === "pt" ? "pt" : "es"
    }
  } catch (error) {
    console.error("Error detecting language from IP:", error)
  }
  
  // Fallback: usar español por defecto
  return "es"
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Inicializar con detección automática (pero consistente en SSR)
  const [language, setLanguageState] = useState<Language>("es")
  const [t, setT] = useState(getTranslations("es"))
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Solo después de montar en el cliente
    setMounted(true)
    
    // Verificar si hay un idioma guardado en localStorage
    // Si existe, usarlo (el usuario ya eligió manualmente)
    const savedLang = localStorage.getItem("language") as Language
    if (savedLang && (savedLang === "pt" || savedLang === "es")) {
      setLanguageState(savedLang)
      setT(getTranslations(savedLang))
      return
    }
    
    // Si no hay idioma guardado, detectar automáticamente por IP
    // Solo Brasil es portugués, todo lo demás es español
    detectLanguageFromIP().then((detectedLang) => {
      setLanguageState(detectedLang)
      setT(getTranslations(detectedLang))
      // Guardar el idioma detectado para que no cambie en futuras visitas
      localStorage.setItem("language", detectedLang)
    }).catch((error) => {
      console.error("Error detecting language:", error)
      // En caso de error, usar español por defecto
      const defaultLang: Language = "es"
      setLanguageState(defaultLang)
      setT(getTranslations(defaultLang))
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

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
