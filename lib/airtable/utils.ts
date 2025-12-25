/**
 * Utilidades para trabajar con Airtable
 */

/**
 * Infiere el idioma basado en el país seleccionado
 * @param pais - Nombre del país
 * @param ciudad - Nombre de la ciudad (opcional, no se usa por ahora)
 * @returns Nombre del idioma (Español, Inglés, Portugués)
 */
export function inferLanguage(pais?: string, ciudad?: string): string {
  if (!pais) return "Español"; // Default español

  // Brasil → Portugués
  if (pais === "Brasil" || pais === "Brazil") {
    return "Portugués";
  }

  // Estados Unidos → Inglés
  if (pais === "Estados Unidos" || pais === "United States" || pais === "USA") {
    return "Inglés";
  }

  // Todos los demás países → Español
  return "Español";
}

/**
 * Sanitiza un string para Airtable
 * Elimina caracteres problemáticos y trim
 */
export function sanitizeString(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.trim();
}

/**
 * Genera el link único para subida de fotos
 */
export function generateUploadPhotosLink(recordId: string, baseUrl?: string): string {
  const url = baseUrl || process.env.NEXT_PUBLIC_URL || process.env.VERCEL_URL || "http://localhost:3000";
  // Asegurar que la URL no termine con /
  const cleanUrl = url.endsWith("/") ? url.slice(0, -1) : url;
  return `${cleanUrl}/fotos?marca=${recordId}`;
}

