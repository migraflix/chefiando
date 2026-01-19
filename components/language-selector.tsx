"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  // Evitar mismatch de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  // Usar el idioma del contexto (ya detectado por IP)
  // Durante SSR usar "es" por defecto para consistencia
  const displayLanguage = mounted ? language : "es";

  return (
    <div className="flex items-center gap-1 bg-card border rounded-lg p-2 shadow-sm" suppressHydrationWarning>
      <Languages className="h-4 w-4 text-muted-foreground" />
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
