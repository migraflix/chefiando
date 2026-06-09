"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { leadSchema, type LeadFormData } from "@/lib/validation/lead-schema";

type FieldErrors = Partial<Record<keyof LeadFormData, string>>;

const INITIAL_DATA: LeadFormData = {
  nombre: "",
  negocio: "",
  email: "",
  whatsapp: "",
};

export function LeadForm() {
  const router = useRouter();
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
        body: JSON.stringify({ ...result.data, origen: "Landing" }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "No se pudo enviar el formulario");
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
        <Label htmlFor="nombre">Tu nombre</Label>
        <Input
          id="nombre"
          value={data.nombre}
          onChange={(e) => update("nombre", e.target.value)}
          placeholder="Ej. Ana García"
          autoComplete="name"
        />
        {errors.nombre && <p className="text-sm text-destructive">{errors.nombre}</p>}
      </div>

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

      <div className="space-y-2">
        <Label htmlFor="whatsapp">WhatsApp (con código de país)</Label>
        <Input
          id="whatsapp"
          type="tel"
          value={data.whatsapp}
          onChange={(e) => update("whatsapp", e.target.value)}
          placeholder="+52 55 1234 5678"
          autoComplete="tel"
        />
        {errors.whatsapp && <p className="text-sm text-destructive">{errors.whatsapp}</p>}
      </div>

      {submitError && (
        <p className="text-sm text-destructive text-center">{submitError}</p>
      )}

      <Button type="submit" size="lg" className="w-full text-lg py-6" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Quiero empezar"}
      </Button>
    </form>
  );
}
