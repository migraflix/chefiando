# Changelog - Upload de Productos

## V1.0.0 (Actual) - 2025-01-21

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
