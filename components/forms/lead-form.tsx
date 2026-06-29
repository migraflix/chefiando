"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { leadSchema, type LeadFormData } from "@/lib/validation/lead-schema";
import { useUtmParams } from "@/hooks/use-utm-params";
import { useLanguage } from "@/contexts/language-context";

type FieldErrors = Partial<Record<keyof LeadFormData, string>>;

const INITIAL_DATA: LeadFormData = {
  nombre: "",
  negocio: "",
  email: "",
  whatsapp: "",
};

// Etiquetas y placeholders de los campos. Por defecto en español;
// se pueden sobreescribir para traducir el form (ej. /oportunidad en pt).
type LeadFormLabels = {
  nombreLabel?: string;
  nombrePlaceholder?: string;
  whatsappLabel?: string;
  whatsappPlaceholder?: string;
};

type LeadFormProps = {
  origen?: string;
  ctaLabel?: string;
  onSuccess?: (recordId: string, data: LeadFormData) => void;
  // "minimal" muestra solo nombre + WhatsApp (negocio/email se piden en /registro).
  // "full" (default) muestra los 4 campos.
  fields?: "full" | "minimal";
  labels?: LeadFormLabels;
};

export function LeadForm({
  origen = "Landing",
  ctaLabel = "Quiero empezar",
  onSuccess,
  fields = "full",
  labels,
}: LeadFormProps = {}) {
  const isMinimal = fields === "minimal";
  const nombreLabel = labels?.nombreLabel ?? "Tu nombre";
  const nombrePlaceholder = labels?.nombrePlaceholder ?? "Ej. Ana García";
  const whatsappLabel = labels?.whatsappLabel ?? "WhatsApp (con código de país)";
  const whatsappPlaceholder = labels?.whatsappPlaceholder ?? "52 55 1234 5678";
  const router = useRouter();
  const utm = useUtmParams();
  const { language } = useLanguage();
  const [data, setData] = useState<LeadFormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field: keyof LeadFormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const result = leadSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.errors) {
        const key = issue.path[0] as keyof LeadFormData;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.data, origen, utm, language }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "No se pudo enviar el formulario");
      }

      const body = await response.json().catch(() => ({}));
      const recordId = typeof body.recordId === "string" ? body.recordId : "";

      if (onSuccess) {
        onSuccess(recordId, result.data);
        return;
      }

      router.push("/thank-you");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Ocurrió un error. Intenta de nuevo.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="nombre">{nombreLabel}</Label>
        <Input
          id="nombre"
          value={data.nombre}
          onChange={(e) => update("nombre", e.target.value)}
          placeholder={nombrePlaceholder}
          autoComplete="name"
        />
        {errors.nombre && <p className="text-sm text-destructive">{errors.nombre}</p>}
      </div>

      {!isMinimal && (
        <div className="space-y-2">
          <Label htmlFor="negocio">Nombre del negocio</Label>
          <Input
            id="negocio"
            value={data.negocio}
            onChange={(e) => update("negocio", e.target.value)}
            placeholder="Ej. Tacos La Esquina"
          />
          {errors.negocio && <p className="text-sm text-destructive">{errors.negocio}</p>}
        </div>
      )}

      {!isMinimal && (
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="tu@correo.com"
            autoComplete="email"
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="whatsapp">{whatsappLabel}</Label>
        <Input
          id="whatsapp"
          type="tel"
          value={data.whatsapp}
          onChange={(e) => update("whatsapp", e.target.value)}
          placeholder={whatsappPlaceholder}
          autoComplete="tel"
        />
        {errors.whatsapp && <p className="text-sm text-destructive">{errors.whatsapp}</p>}
      </div>

      {submitError && (
        <p className="text-sm text-destructive text-center">{submitError}</p>
      )}

      <Button type="submit" size="lg" className="w-full text-lg py-6" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : ctaLabel}
      </Button>
    </form>
  );
}
