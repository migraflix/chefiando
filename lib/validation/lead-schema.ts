import { z } from "zod";

/**
 * Esquema de validación para el formulario de lead de campaña.
 * Captura los datos mínimos para contacto: nombre y WhatsApp (obligatorios),
 * negocio y email (opcionales, se completan en el paso siguiente /registro).
 *
 * Reusa la misma lógica de validación de WhatsApp del flujo de marca
 * (código de país LATAM/España + longitud razonable).
 */
export const leadSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre es obligatorio")
    .max(60, "El nombre no puede exceder 60 caracteres")
    .transform((val) => val.trim()),
  // Opcional: en /oportunidad solo pedimos nombre + WhatsApp; el negocio
  // se captura en /registro. Si viene, se valida la longitud.
  negocio: z
    .string()
    .max(80, "El nombre del negocio no puede exceder 80 caracteres")
    .transform((val) => val.trim())
    .optional()
    .or(z.literal("")),
  // Opcional por la misma razón: el email se pide en el paso siguiente.
  email: z
    .string()
    .max(254, "El email es demasiado largo")
    .refine(
      (val) => {
        if (!val) return true; // opcional

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) return false;

        // Bloquear emails temporales/disposables comunes
        const disposableDomains = [
          "10minutemail.com", "guerrillamail.com", "mailinator.com",
          "temp-mail.org", "throwaway.email", "yopmail.com",
          "maildrop.cc", "tempail.com", "dispostable.com",
        ];
        const domain = val.split("@")[1]?.toLowerCase();
        if (!domain || disposableDomains.includes(domain)) return false;

        const domainParts = domain.split(".");
        return domainParts.length >= 2;
      },
      { message: "Por favor ingresa un email válido (no aceptamos emails temporales)" }
    )
    .optional()
    .or(z.literal("")),
  whatsapp: z
    .string()
    .min(1, "El WhatsApp es obligatorio")
    // Normaliza:
    //  1) quita espacios/guiones/parentesis
    //  2) agrega "+" si falta
    //  3) MX: WhatsApp requiere "1" despues del codigo pais para celulares.
    //     +52 + 10 digitos -> +521 + 10 digitos. Sin esto no llega el mensaje.
    .transform((val) => {
      const clean = val.replace(/[\s\-\(\)]/g, "");
      const withPlus = clean.startsWith("+") ? clean : `+${clean}`;
      // MX: si es +52 + 10 digitos (sin "1"), inserta el "1".
      if (/^\+52\d{10}$/.test(withPlus)) {
        return `+521${withPlus.slice(3)}`;
      }
      return withPlus;
    })
    .refine(
      (val) => {
        // Códigos de país válidos para LATAM y España
        const validCountryCodes = [
          "1", "34", "52", "54", "55", "56", "57", "58", "591", "592",
          "593", "595", "597", "598", "599", "501", "502", "503", "504",
          "505", "506", "507", "509", "51",
        ];

        const hasValidCountryCode = validCountryCodes.some((code) =>
          val.startsWith(`+${code}`)
        );
        if (!hasValidCountryCode) return false;

        // Solo dígitos después del +
        if (!/^\+\d+$/.test(val)) return false;

        // Longitud total razonable
        const digitsOnly = val.substring(1);
        return digitsOnly.length >= 8 && digitsOnly.length <= 15;
      },
      {
        message:
          "Por favor ingresa un número de WhatsApp válido con código de país (ej: 5215555555555)",
      }
    ),
});

export type LeadFormData = z.infer<typeof leadSchema>;

/**
 * UTMs y metadata de atribucion capturados desde la URL de la landing.
 * Todos opcionales: si el lead llega organico, simplemente no vienen.
 */
export const utmSchema = z.object({
  utm_source: z.string().max(120).optional(),
  utm_medium: z.string().max(120).optional(),
  utm_campaign: z.string().max(200).optional(),
  utm_term: z.string().max(200).optional(),
  utm_content: z.string().max(200).optional(),
  landing_path: z.string().max(200).optional(),
  referrer: z.string().max(500).optional(),
  click_id: z.string().max(200).optional(),
});

export type UtmParams = z.infer<typeof utmSchema>;
