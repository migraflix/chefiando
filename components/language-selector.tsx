"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
// Using inline SVG for language icon

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [methodConfig, setMethodConfig] = useState({
    TEST_UPLOAD: 'false' // Default to base64 initially
  });

  // Evitar mismatch de hidratación
  useEffect(() => {
    setMounted(true);

    // Cargar configuración del método de upload
    async function loadConfig() {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const config = await response.json();
          setMethodConfig({
            TEST_UPLOAD: config.TEST_UPLOAD
          });
        } else {
          console.error('LanguageSelector - Failed to load config:', response.status);
        }
      } catch (error) {
        console.error('LanguageSelector - Error loading config:', error);
      }
    }

    loadConfig();
  }, []);

  // Usar el idioma del contexto (ya detectado por IP)
  // Durante SSR usar "es" por defecto para consistencia
  const displayLanguage = mounted ? language : "es";


  return (
    <div className="flex items-center gap-1 bg-card border rounded-lg p-2 shadow-sm" suppressHydrationWarning>
      {/* Indicador del método de upload */}
      <div className={`w-2 h-2 rounded-full ${
        methodConfig.TEST_UPLOAD === 'true' ? 'bg-blue-500' : 'bg-green-500'
      }`} title={
        methodConfig.TEST_UPLOAD === 'true'
          ? 'Google Cloud Storage activado'
          : 'Base64 activado'
      }></div>

      <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.02 18.02 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
      <span className="text-xs font-medium mr-2">
        {displayLanguage === "pt" ? "Português" : "Español"}
      </span>
      <Button
        variant={displayLanguage === "pt" ? "default" : "ghost"}
        size="sm"
        onClick={() => setLanguage("pt")}
        className="text-xs px-3 h-7"
        title="Alterar para português"
      >
        🇧🇷 PT
      </Button>
      <Button
        variant={displayLanguage === "es" ? "default" : "ghost"}
        size="sm"
        onClick={() => setLanguage("es")}
        className="text-xs px-3 h-7"
        title="Cambiar a español"
      >
        🇪🇸 ES
      </Button>
    </div>
  );
}
