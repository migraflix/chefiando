/**
 * Configuración centralizada de la aplicación
 * Todas las constantes importantes se definen aquí
 */

// ⚙️ CONFIGURACIÓN PRINCIPAL - LEE DE VARIABLES DE ENTORNO
export const CONFIG = {
  // Límite máximo de productos por marca - LEE DE .env.local (NEXT_PUBLIC_MAX_PRODUCTS)
  MAX_PRODUCTS: parseInt(process.env.NEXT_PUBLIC_MAX_PRODUCTS || '3'),

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

/**
 * 🔧 INSTRUCCIONES PARA CAMBIAR LA CONFIGURACIÓN:
 *
 * 1. Para cambiar el número máximo de productos:
 *    - Edita .env.local: NEXT_PUBLIC_MAX_PRODUCTS=5
 *    - Cambia el número por el valor deseado
 *
 * 2. Para cambiar límites de archivos:
 *    - Edita los valores en este archivo (MAX_FILE_SIZE, etc.)
 *
 * 3. Reinicia el servidor de desarrollo después de cambiar
 *
 * .✅ NEXT_PUBLIC_ variables están disponibles en servidor y cliente
 * ✅ Evita errores de hidratación (hydration mismatch)
 */