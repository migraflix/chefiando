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
 * Detecta el idioma basado en la ubicación del usuario
 * Usa el idioma del navegador como fuente principal
 */
function detectLanguageFromLocation(): Language {
  if (typeof window === "undefined") return "es" // Default para SSR
  
  // Intentar detectar por idioma del navegador (más confiable)
  const browserLang = navigator.language || navigator.languages?.[0] || "es"
  const langCode = browserLang.split("-")[0].toLowerCase()
  
  // Si el idioma del navegador es portugués, usar portugués
  if (langCode === "pt") {
    return "pt"
  }
  
  // Intentar detectar por timezone (Brasil usa timezone de América/São_Paulo)
  // Esto es un fallback si el idioma del navegador no está configurado correctamente
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    // Timezones de Brasil
    const brazilTimezones = [
      "America/Sao_Paulo", "America/Fortaleza", "America/Recife", "America/Bahia",
      "America/Manaus", "America/Cuiaba", "America/Campo_Grande", "America/Belem",
      "America/Araguaina", "America/Maceio", "America/Noronha", "America/Boa_Vista",
      "America/Rio_Branco", "America/Porto_Velho"
    ]
    
    if (brazilTimezones.some(tz => timezone.includes(tz))) {
      return "pt"
    }
  } catch (e) {
    // Si falla, continuar con la detección por idioma
  }
  
  // Por defecto, español para países de habla hispana y otros
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
    
    // Si no hay idioma guardado, detectar automáticamente SOLO LA PRIMERA VEZ
    // Esto evita que se cambie el idioma después de que el usuario ya lo haya seleccionado
    const detectedLang = detectLanguageFromLocation()
    setLanguageState(detectedLang)
    setT(getTranslations(detectedLang))
    // Guardar el idioma detectado para que no cambie en futuras visitas
    localStorage.setItem("language", detectedLang)
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
