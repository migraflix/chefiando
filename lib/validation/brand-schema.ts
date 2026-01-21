import { z } from "zod";

/**
 * Función helper para sanitizar strings y prevenir XSS
 */
function sanitizeString(value: string): string {
  if (!value) return value;

  // Caracteres peligrosos a remover
  const dangerousChars = [
    '<', '>', '"', "'", '`',
    '&lt;', '&gt;', '&quot;', '&#x27;', '&#x2F;',
    'javascript:', 'data:', 'vbscript:'
  ];

  let sanitized = value;

  // Remover caracteres peligrosos
  dangerousChars.forEach(char => {
    sanitized = sanitized.replace(new RegExp(char, 'gi'), '');
  });

  // Remover patrones de script
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  // Normalizar espacios múltiples
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

/**
 * Esquema de validación para el formulario de registro de marca
 * Usa Zod para validación de tipos y formato
 */
export const brandRegistrationSchema = z.object({
  emprendedor: z
    .string()
    .optional()
    .transform((val) => val ? sanitizeString(val) : val)
    .refine(
      (val) => {
        if (!val) return true;
        const trimmed = val.trim();
        // Verificar longitud razonable (2-50 caracteres)
        return trimmed.length >= 2 && trimmed.length <= 50;
      },
      { message: "El nombre debe tener entre 2 y 50 caracteres" }
    ),
  negocio: z
    .string()
    .min(2, "El nombre del negocio es obligatorio")
    .max(80, "El nombre del negocio no puede exceder 80 caracteres")
    .transform(sanitizeString)
    .refine(
      (val) => {
        const trimmed = val.trim();
        return trimmed.length >= 3 && trimmed.length <= 80;
      },
      { message: "El nombre del negocio debe tener entre 3 y 80 caracteres" }
    ),
  correo: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => {
        if (!val || val === "") return true; // Opcional

        // Validación básica de formato
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          return false;
        }

        // Verificar longitud razonable
        if (val.length < 5 || val.length > 254) {
          return false;
        }

        // Evitar emails temporales/disposables comunes
        const disposableDomains = [
          '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
          'temp-mail.org', 'throwaway.email', 'yopmail.com',
          'maildrop.cc', 'tempail.com', 'dispostable.com'
        ];

        const domain = val.split('@')[1]?.toLowerCase();
        if (disposableDomains.includes(domain)) {
          return false;
        }

        // Verificar que tenga al menos un punto en el dominio
        const domainParts = domain?.split('.');
        if (!domainParts || domainParts.length < 2) {
          return false;
        }

        return true;
      },
      {
        message: "Por favor ingresa un email válido (no aceptamos emails temporales)"
      }
    ),
  ciudad: z
    .string()
    .optional()
    .transform((val) => val ? sanitizeString(val) : val)
    .refine(
      (val) => {
        if (!val) return true;
        const trimmed = val.trim();
        // Ciudades: 2-50 caracteres (ej: "Lima", "Ciudad de México")
        return trimmed.length >= 2 && trimmed.length <= 50;
      },
      { message: "La ciudad debe tener entre 2 y 50 caracteres" }
    ),
  pais: z
    .string()
    .optional()
    .transform((val) => val ? sanitizeString(val) : val)
    .refine(
      (val) => {
        if (!val) return true;
        const trimmed = val.trim();
        // Países: 2-50 caracteres (ej: "Perú", "Estados Unidos")
        return trimmed.length >= 2 && trimmed.length <= 50;
      },
      { message: "El país debe tener entre 2 y 50 caracteres" }
    ),
  whatsapp: z
    .string()
    .min(1, "El WhatsApp es obligatorio")
    .refine(
      (val) => {
        if (!val || val === "") return false; // Obligatorio

        // Remover espacios, guiones y paréntesis
        const cleanNumber = val.replace(/[\s\-\(\)]/g, "");

        // Debe empezar con +
        if (!cleanNumber.startsWith("+")) {
          return false;
        }

        // Códigos de país válidos para países de LATAM y España
        const validCountryCodes = [
          "1",   // USA/Canada
          "34",  // España
          "52",  // México
          "54",  // Argentina
          "55",  // Brasil
          "56",  // Chile
          "57",  // Colombia
          "58",  // Venezuela
          "591", // Bolivia
          "592", // Guyana
          "593", // Ecuador
          "595", // Paraguay
          "597", // Surinam
          "598", // Uruguay
          "599", // Curazao/Aruba
          "501", // Belice
          "502", // Guatemala
          "503", // El Salvador
          "504", // Honduras
          "505", // Nicaragua
          "506", // Costa Rica
          "507", // Panamá
          "509", // Haití
          "51",  // Perú
        ];

        // Verificar si el código de país es válido
        const hasValidCountryCode = validCountryCodes.some(code =>
          cleanNumber.startsWith(`+${code}`)
        );

        if (!hasValidCountryCode) {
          return false;
        }

        // Después del código de país debe haber al menos 6 dígitos
        const numberWithoutCode = cleanNumber.substring(1); // Remover el +
        const digitsOnly = numberWithoutCode.replace(/\D/g, "");

        // Longitud total razonable (código + número)
        if (digitsOnly.length < 8 || digitsOnly.length > 15) {
          return false;
        }

        // Solo debe contener dígitos después del +
        if (!/^\+\d+$/.test(cleanNumber)) {
          return false;
        }

        return true;
      },
      {
        message: "Por favor ingresa un número de WhatsApp válido con código de país (ej: +51987654321)"
      }
    ),
  instagram: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true; // Opcional

        try {
          const url = new URL(val);

          // Debe ser HTTPS
          if (url.protocol !== 'https:') {
            return false;
          }

          // Dominio debe ser instagram.com (con o sin www)
          const hostname = url.hostname.toLowerCase();
          if (hostname !== 'instagram.com' && hostname !== 'www.instagram.com') {
            return false;
          }

          // Debe tener un pathname (usuario) - no solo el dominio
          if (!url.pathname || url.pathname === '/' || url.pathname.length < 2) {
            return false;
          }

          // Evitar caracteres peligrosos en la URL
          const dangerousChars = ['<', '>', '"', "'", '(', ')', '[', ']', '{', '}', '\\', '|', '^', '`'];
          if (dangerousChars.some(char => val.includes(char))) {
            return false;
          }

          return true;
        } catch {
          return false;
        }
      },
      {
        message:
          "Ingresa una URL completa de Instagram (ej: https://www.instagram.com/tu_usuario/)",
      }
    ),
  descripcion: z
    .string()
    .max(1000, "La descripción no puede exceder 1000 caracteres")
    .optional()
    .transform((val) => val ? sanitizeString(val) : val)
    .refine(
      (val) => {
        if (!val) return true;
        const trimmed = val.trim();
        // Descripción: opcional, pero si se proporciona debe tener al menos 10 caracteres
        return trimmed.length === 0 || (trimmed.length >= 10 && trimmed.length <= 1000);
      },
      { message: "La descripción debe tener al menos 10 caracteres si se proporciona" }
    ),
});

export type BrandFormData = z.infer<typeof brandRegistrationSchema>;

