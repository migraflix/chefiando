"use client";

import { BrandRegistrationForm } from "@/components/forms/brand-registration-form";
import { LanguageSelector } from "@/components/language-selector";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";

export default function RegistroPage() {
  const { language, locationInfo } = useLanguage();

  return (
    <div className="h-screen w-full overflow-hidden relative bg-background">
      {/* Selector de idioma flotante - más visible */}
      <div className="fixed top-4 right-4 z-50 bg-white/95 backdrop-blur-sm border-2 border-primary/20 rounded-lg p-2 shadow-lg">
        <LanguageSelector />
      </div>

      {/* Header fijo */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-start px-4 pt-4 pb-2 safe-area-top bg-background/95 backdrop-blur-sm">
        <Link href="/">
          <Button variant="ghost" size="icon-sm" className="h-8 w-8 -ml-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Debug info temporal */}
      {process.env.NODE_ENV === "development" && (
        <div className="absolute top-16 left-4 z-50 bg-yellow-100 border border-yellow-300 rounded-lg p-2 text-xs max-w-xs">
          <div>Idioma: {language}</div>
          <div>País: {locationInfo?.country || "Desconocido"}</div>
          <div>IP: {locationInfo?.ip || "Desconocida"}</div>
        </div>
      )}

      {/* Formulario */}
      <div className="h-full pt-14 flex flex-col">
        <BrandRegistrationForm />
      </div>
    </div>
  );
}
