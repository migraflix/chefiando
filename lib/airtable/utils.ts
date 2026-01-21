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
 * Elimina caracteres problemáticos, escapa caracteres especiales y trim
 */
export function sanitizeString(value: string | undefined): string | undefined {
  if (!value || typeof value !== 'string') return undefined;

  try {
    // Trim primero
    let sanitized = value.trim();

    // Si el string está vacío después del trim, devolver undefined
    if (!sanitized) return undefined;

    // Reemplazar caracteres problemáticos comunes
    sanitized = sanitized
      .replace(/\r\n/g, '\n') // Normalizar line breaks
      .replace(/\r/g, '\n') // Normalizar line breaks
      .replace(/\t/g, ' ') // Reemplazar tabs con espacios
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Eliminar zero-width characters
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Eliminar caracteres de control (más amplio)
      .replace(/\u00A0/g, ' ') // Reemplazar non-breaking space con espacio normal
      .replace(/[\uD800-\uDFFF]/g, '') // Eliminar surrogates incompletos
      .replace(/[\uFFFD]/g, '') // Eliminar replacement character
      .trim();

    // Verificar que el string resultante sea válido para JSON
    JSON.stringify(sanitized);

    // Verificación final: si quedó vacío después de sanitizar, devolver undefined
    return sanitized || undefined;

  } catch (error) {
    console.error('Error sanitizando string:', error, { originalValue: value.substring(0, 100) });

    // Si hay un error, devolver una versión muy básica y segura
    try {
      const fallback = value.replace(/[^\w\sáéíóúüñÁÉÍÓÚÜÑ.,;:!?()-]/g, '').trim();
      return fallback || undefined;
    } catch (fallbackError) {
      console.error('Error en fallback de sanitización:', fallbackError);
      // Si todo falla, devolver un valor seguro
      return 'Texto con caracteres especiales';
    }
  }
}

/**
 * Sanitiza un nombre de archivo para asegurar compatibilidad
 * Normaliza acentos y caracteres especiales para evitar problemas en JSON y APIs
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return '';

  // Mantener los acentos pero normalizar otros caracteres problemáticos
  let sanitized = fileName
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Eliminar zero-width characters
    .replace(/[\u0000-\u001F]/g, '') // Eliminar caracteres de control
    .replace(/[<>:"/\\|?*]/g, '') // Eliminar caracteres inválidos para nombres de archivo
    .replace(/\s+/g, ' ') // Normalizar espacios múltiples
    .trim();

  // Si el nombre queda vacío, generar uno genérico
  if (!sanitized) {
    const extension = fileName.split('.').pop() || 'jpg';
    sanitized = `imagen.${extension}`;
  }

  return sanitized;
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

