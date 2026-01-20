/**
 * Configuración centralizada de la aplicación
 * Todas las constantes importantes se definen aquí
 */

// ⚙️ CONFIGURACIÓN PRINCIPAL
export const CONFIG = {
  // Límite máximo de productos por marca
  MAX_PRODUCTS: parseInt(process.env.MAX_PRODUCTS || '5'),

  // Límites de archivos
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png"],
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_NAME_LENGTH: 100,
} as const;

// Para compatibilidad, exportamos individualmente
export const MAX_PRODUCTS = CONFIG.MAX_PRODUCTS;
export const MAX_FILE_SIZE = CONFIG.MAX_FILE_SIZE;
export const ALLOWED_TYPES = CONFIG.ALLOWED_TYPES;
export const MAX_DESCRIPTION_LENGTH = CONFIG.MAX_DESCRIPTION_LENGTH;
export const MAX_NAME_LENGTH = CONFIG.MAX_NAME_LENGTH;