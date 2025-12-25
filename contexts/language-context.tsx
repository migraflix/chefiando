"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type Language, getTranslations } from "@/lib/i18n"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: ReturnType<typeof getTranslations>
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Inicializar con un valor por defecto que será consistente en SSR
  const [language, setLanguageState] = useState<Language>("pt")
  const [t, setT] = useState(getTranslations("pt"))
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Solo después de montar en el cliente, cargar desde localStorage
    setMounted(true)
    const savedLang = localStorage.getItem("language") as Language
    if (savedLang && (savedLang === "pt" || savedLang === "es")) {
      setLanguageState(savedLang)
      setT(getTranslations(savedLang))
    }
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
