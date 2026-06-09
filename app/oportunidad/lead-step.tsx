"use client";

import { useRouter } from "next/navigation";
import { LeadForm } from "@/components/forms/lead-form";
import type { LeadFormData } from "@/lib/validation/lead-schema";

const PREFILL_STORAGE_KEY = "chefiando_lead_prefill";

export function OportunidadLeadStep() {
  const router = useRouter();

  const handleSuccess = (recordId: string, data: LeadFormData) => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(
          PREFILL_STORAGE_KEY,
          JSON.stringify({ recordId, ...data })
        );
      } catch {
        // sin storage no es bloqueante: /registro pide los datos de nuevo si falta.
      }
    }
    const qs = new URLSearchParams({
      lead: recordId,
      nombre: data.nombre,
      negocio: data.negocio,
      email: data.email,
      whatsapp: data.whatsapp,
    });
    router.push(`/registro?${qs.toString()}`);
  };

  return (
    <LeadForm
      origen="Oportunidad"
      ctaLabel="Continuar"
      onSuccess={handleSuccess}
    />
  );
}
