"use client";

import { useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BrandRegistrationForm } from "@/components/forms/brand-registration-form";
import { LanguageSelector } from "@/components/language-selector";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function RegistroContent() {
  const searchParams = useSearchParams();

  const leadId = searchParams.get("lead") ?? undefined;
  const prefillNombre = searchParams.get("nombre") ?? "";
  const prefillNegocio = searchParams.get("negocio") ?? "";
  const prefillEmail = searchParams.get("email") ?? "";
  const prefillWhatsapp = searchParams.get("whatsapp") ?? "";

  // Marcar el lead como "Registrando" en cuanto llegue a esta pagina.
  // Mide el drop-off entre Paso 1 (lead capturado) y Paso 2 completado.
  useEffect(() => {
    if (!leadId || !leadId.startsWith("rec")) return;
    fetch(`/api/leads/${leadId}/registrando`, { method: "PATCH" }).catch((err) =>
      console.warn("No se pudo marcar lead Registrando:", err)
    );
  }, [leadId]);

  const defaultValues = useMemo(
    () => ({
      emprendedor: prefillNombre,
      negocio: prefillNegocio,
      correo: prefillEmail,
      whatsapp: prefillWhatsapp,
    }),
    [prefillNombre, prefillNegocio, prefillEmail, prefillWhatsapp]
  );

  return (
    <div className="h-screen w-full overflow-hidden relative bg-background">
      <div className="fixed top-4 right-4 z-50 bg-white/95 backdrop-blur-sm border-2 border-primary/20 rounded-lg p-2 shadow-lg">
        <LanguageSelector />
      </div>

      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-start px-4 pt-4 pb-2 safe-area-top bg-background/95 backdrop-blur-sm">
        <Link href="/">
          <Button variant="ghost" size="icon-sm" className="h-8 w-8 -ml-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
        </Link>
      </div>

      <div className="h-full pt-14 flex flex-col">
        <BrandRegistrationForm leadId={leadId} defaultValues={defaultValues} />
      </div>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <Suspense fallback={null}>
      <RegistroContent />
    </Suspense>
  );
}
