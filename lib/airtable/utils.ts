/**
 * Utilidades para trabajar con Airtable
 */

/**
 * Infiere el idioma basado en el país seleccionado
 * @param pais - Nombre del país
 * @param ciudad - Nombre de la ciudad (opcional)
 * @returns Código del idioma (es, en, pt, etc.)
 */
export function inferLanguage(pais?: string, ciudad?: string): string {
  if (!pais) return "es"; // Default español

  const languageMap: Record<string, string> = {
    Perú: "es",
    Colombia: "es",
    Chile: "es",
    Argentina: "es",
    México: "es",
    España: "es",
    Ecuador: "es",
    Venezuela: "es",
    "Estados Unidos": "en",
    "United States": "en",
    Brasil: "pt",
    Portugal: "pt",
    // Agregar más países según necesidad
  };

  return languageMap[pais] || "es"; // Default español
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

