"use client";

import { useRouter } from "next/navigation";
import { LeadForm } from "@/components/forms/lead-form";
import type { LeadFormData } from "@/lib/validation/lead-schema";
import { trackLead } from "@/lib/ads-events";

const PREFILL_STORAGE_KEY = "chefiando_lead_prefill";

type LeadFormLabels = {
  nombreLabel?: string;
  nombrePlaceholder?: string;
  whatsappLabel?: string;
  whatsappPlaceholder?: string;
};

export function OportunidadLeadStep({
  ctaLabel = "Continuar",
  labels,
}: { ctaLabel?: string; labels?: LeadFormLabels } = {}) {
  const router = useRouter();

  const handleSuccess = (recordId: string, data: LeadFormData) => {
    trackLead({ content_name: "Oportunidad", lead_id: recordId });
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
    // En /oportunidad solo capturamos nombre + WhatsApp; negocio/email se
    // completan en /registro, así que pueden venir vacíos.
    const qs = new URLSearchParams({
      lead: recordId,
      nombre: data.nombre,
      negocio: data.negocio ?? "",
      email: data.email ?? "",
      whatsapp: data.whatsapp,
    });
    router.push(`/registro?${qs.toString()}`);
  };

  return (
    <LeadForm
      origen="Oportunidad"
      ctaLabel={ctaLabel}
      fields="minimal"
      labels={labels}
      onSuccess={handleSuccess}
    />
  );
}
