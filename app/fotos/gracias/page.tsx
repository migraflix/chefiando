"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { LanguageSelector } from "@/components/language-selector";
import { trackCompleteRegistration } from "@/lib/ads-events";
// Using inline SVG for check icon

export default function GraciasPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const marca = searchParams.get("marca");
  const processed = searchParams.get("processed");
  const { t, language, locationInfo } = useLanguage();

  console.log('📄 Página de gracias cargada', { marca, processed, searchParams: Object.fromEntries(searchParams.entries()) });

  // Cierra el embudo: si este Brand vino de un lead de /oportunidad,
  // el endpoint busca al Emprendedor por Brand linkeado y lo marca "Cuenta abierta".
  // No bloquea: si falla o no hay lead, no le mostramos error al usuario.
  useEffect(() => {
    if (!marca) return;
    fetch("/api/leads/complete-by-brand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandRecordId: marca }),
    }).catch((err) => console.warn("No se pudo cerrar el lead:", err));
  }, [marca]);

  // Solo cuenta como conversion real cuando ?processed=1 — evita doble disparo
  // si el usuario refresca o aterriza sin procesar.
  useEffect(() => {
    if (processed !== "1") return;
    trackCompleteRegistration({ content_name: "FotosGracias", brand_id: marca ?? undefined });
  }, [processed, marca]);

  const handleGoToBrand = () => {
    console.log('🖱️ Click en botón "Ver minha marca"', { marca });

    if (marca) {
      console.log('🔗 Navegando a:', `/marca/ver/${marca}`);
      router.push(`/marca/ver/${marca}`);
    } else {
      console.error('❌ No hay parámetro marca disponible');
    }
  };

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="fixed top-4 right-4 z-50 bg-background/80 backdrop-blur-sm border rounded-lg p-2 shadow-lg">
        <LanguageSelector />
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <CardContent className="pt-12 pb-12 px-8">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-100 p-4">
                <svg className="h-16 w-16 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">{t.products.thanks.title}</h1>
            <h2 className="text-2xl font-semibold text-muted-foreground mb-6">
              {t.products.thanks.subtitle}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t.products.thanks.description}
            </p>
            {marca ? (
              <Button
                onClick={handleGoToBrand}
                size="lg"
                className="text-lg px-8 bg-orange-500 hover:bg-orange-600 text-white"
              >
                {t.products.thanks.button}
              </Button>
            ) : (
              <div className="text-sm text-gray-500 p-4 border rounded">
                ⚠️ No se pudo obtener el ID de la marca. Por favor, contacta al soporte.
                <br />
                <small>Parámetros recibidos: {JSON.stringify({ marca, processed })}</small>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}



