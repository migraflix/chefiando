# Changelog - Migraflix

## V1.0.1 (Actual) - 2025-01-21

### 🚀 Nuevas Funcionalidades
- **FEAT: Botón "Terminar" procesa productos pendientes**
  - ✅ El botón "Terminar" ahora valida si hay productos con imagen sin procesar
  - ✅ Si encuentra productos pendientes, los procesa y envía al webhook antes de salir
  - ✅ Feedback visual durante el procesamiento del último producto
  - ✅ Logging detallado del flujo de terminación para debugging

### 🐛 Correcciones Críticas
- **FIX: Error "Load failed" en formulario de registro**
  - ✅ Agregado timeout de 30s para evitar conexiones colgadas
  - ✅ Mejorado manejo de errores de red con mensajes específicos en español
  - ✅ Sanitización robusta para caracteres portugueses y especiales
  - ✅ Validación JSON mejorada en sanitización con fallback seguro
  - ✅ Manejo específico de códigos HTTP en API de Airtable
  - ✅ Logging detallado para debugging de conexiones lentas

### 🛠️ Mejoras Técnicas
- **DEBUG: Investigación del botón "Ver minha marca"**
  - ✅ Logs de debugging en página de gracias para verificar parámetro marca
  - ✅ Logs en función de navegación para rastrear clicks
  - ✅ Verificación visual si falta el parámetro marca
  - ✅ Logs en página de marca para confirmar carga correcta
  - ✅ Mejorar estilos del botón para asegurar visibilidad

- **FIX: Error "navigator is not defined" en prerendering**
  - ✅ Agregadas verificaciones `typeof window !== 'undefined'` en páginas de debug
  - ✅ Build exitoso sin errores de SSR

### 📊 Mejoras en API
- **API /brands**: Mejor parsing de JSON y manejo de errores de conexión
- **API /products/upload**: Validación mejorada de datos de productos
- **Sanitización**: Función `sanitizeString` más robusta con caracteres Unicode

---

## V1.0.0 - 2025-01-21

### Upload de Productos

### Estado Actual
- **Webhook URL**: `PRODUCTOS_WEBHOOK` → `https://n8n.migraflix.com/webhook/subirFotos`
- **Método de imagen**: Base64 (límite ~5MB por imagen)
- **Procesamiento**: Por lotes de 1 producto a la vez
- **Envío**: Inmediato al webhook por cada lote

### Funcionalidades
- ✅ Cada producto se sube individualmente al webhook
- ✅ Registro en Airtable (tabla "Fotos AI") antes de enviar
- ✅ Compresión básica para JPEGs > 3MB
- ✅ Reintentos automáticos (2 intentos)
- ✅ Sanitización de datos (nombre, descripción, tags)
- ✅ Soporte para producto individual (`handleSingleProduct`) y múltiples (`handleMultipleProducts`)

### Limitaciones Actuales
- ⚠️ Base64 limita a ~5MB por imagen
- ⚠️ Compresión solo básica (no hay Sharp instalado)

---

## Próximo: V1.1.0 (Planificado)

### Cambios Planificados
- 🔄 Subir imagen a Google Cloud Storage en lugar de base64
- 🔄 Soportar imágenes > 5MB
- 🔄 Enviar URL de imagen al webhook en lugar de base64

---

## Verificación de Versión

Para verificar que estás en la misma versión:
1. El archivo `app/api/products/upload/route.ts` debe tener ~606 líneas
2. La constante `BATCH_SIZE = 1` (línea 12)
3. La constante `SEND_IMMEDIATE = true` (línea 16)
4. Webhook usa `process.env.PRODUCTOS_WEBHOOK` (línea 8)
