import { z } from "zod";

/**
 * Esquema de validación para el formulario de registro de marca
 * Usa Zod para validación de tipos y formato
 */
export const brandRegistrationSchema = z.object({
  emprendedor: z.string().optional(),
  negocio: z
    .string()
    .min(2, "El nombre del negocio es obligatorio")
    .max(100, "El nombre del negocio es demasiado largo"),
  correo: z
    .string()
    .email("Por favor ingresa un email válido")
    .optional()
    .or(z.literal("")),
  ciudad: z.string().optional(),
  pais: z.string().optional(),
  whatsapp: z
    .string()
    .min(1, "El WhatsApp es obligatorio")
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      "Por favor ingresa un número de WhatsApp válido con código de país (ej: +51987654321)"
    ),
  instagram: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true; // Opcional
        try {
          const url = new URL(val);
          return url.hostname.includes("instagram.com");
        } catch {
          return false;
        }
      },
      {
        message:
          "Por favor ingresa un link válido de Instagram (ej: https://www.instagram.com/migraflix/)",
      }
    ),
  descripcion: z
    .string()
    .max(1000, "La descripción no puede exceder 1000 caracteres")
    .optional(),
});

export type BrandFormData = z.infer<typeof brandRegistrationSchema>;

