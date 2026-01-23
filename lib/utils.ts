import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Agrega un parámetro de cache-busting a URLs de imágenes
 * para evitar problemas de caché en iOS Safari
 * @param url - URL de la imagen
 * @param uniqueId - ID único opcional (ej: recordId) para cache más inteligente
 */
export function noCacheUrl(url: string | undefined, uniqueId?: string): string {
  if (!url) return "/placeholder.svg"

  // Si hay uniqueId, usarlo; sino, extraer un identificador de la URL
  // y agregar timestamp por minuto para forzar recarga en iOS
  let cacheBuster: string

  if (uniqueId) {
    // Combinar ID con timestamp por minuto para garantizar frescura
    const minuteTimestamp = Math.floor(Date.now() / 60000)
    cacheBuster = `${uniqueId}-${minuteTimestamp}`
  } else {
    // Usar timestamp directo si no hay ID (forzar recarga siempre)
    cacheBuster = Date.now().toString()
  }

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}v=${cacheBuster}`
}
