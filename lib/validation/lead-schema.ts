import { z } from "zod";

/**
 * Esquema de validación para el formulario de lead de campaña.
 * Captura los datos mínimos para contacto: nombre, negocio, WhatsApp y email.
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
  negocio: z
    .string()
    .min(2, "El nombre del negocio es obligatorio")
    .max(80, "El nombre del negocio no puede exceder 80 caracteres")
    .transform((val) => val.trim()),
  email: z
    .string()
    .min(5, "El email es obligatorio")
    .max(254, "El email es demasiado largo")
    .refine(
      (val) => {
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
    ),
  whatsapp: z
    .string()
    .min(1, "El WhatsApp es obligatorio")
    .refine(
      (val) => {
        if (!val) return false;

        // Remover espacios, guiones y paréntesis
        const cleanNumber = val.replace(/[\s\-\(\)]/g, "");

        // Debe empezar con +
        if (!cleanNumber.startsWith("+")) return false;

        // Códigos de país válidos para LATAM y España
        const validCountryCodes = [
          "1", "34", "52", "54", "55", "56", "57", "58", "591", "592",
          "593", "595", "597", "598", "599", "501", "502", "503", "504",
          "505", "506", "507", "509", "51",
        ];

        const hasValidCountryCode = validCountryCodes.some((code) =>
          cleanNumber.startsWith(`+${code}`)
        );
        if (!hasValidCountryCode) return false;

        // Solo dígitos después del +
        if (!/^\+\d+$/.test(cleanNumber)) return false;

        // Longitud total razonable
        const digitsOnly = cleanNumber.substring(1).replace(/\D/g, "");
        return digitsOnly.length >= 8 && digitsOnly.length <= 15;
      },
      {
        message:
          "Por favor ingresa un número de WhatsApp válido con código de país (ej: +51987654321)",
      }
    ),
});

export type LeadFormData = z.infer<typeof leadSchema>;
