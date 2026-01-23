// Constantes del cliente - NO importar módulos de servidor aquí
// Este archivo puede ser importado desde componentes del cliente

// Configuración de productos
export const MAX_PRODUCTS = 5;
export const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB (limite de Vercel Hobby)

// Tamaño a partir del cual se comprime automáticamente
export const COMPRESS_THRESHOLD = 2 * 1024 * 1024; // 2MB
export const MAX_NAME_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 500;

// Tipos de archivo permitidos
export const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

// Configuración de compresión
export const COMPRESSION_QUALITY = 0.8;