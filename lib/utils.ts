import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Agrega un parámetro de cache-busting a URLs de imágenes
 * para evitar problemas de caché en iOS Safari.
 * @param url - URL de la imagen.
 * @param uniqueId - ID único opcional para una caché más inteligente (actualmente no utilizado, pero conservado para compatibilidad).
 */
export function noCacheUrl(url: string | undefined, uniqueId?: string): string {
  if (!url) return "/placeholder.svg";

  // Usar siempre un timestamp para forzar la recarga en iOS y evitar problemas de caché.
  const cacheBuster = Date.now().toString();

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${cacheBuster}`;
}
