# 🧪 Verificar que Sentry Captura Errores en Producción

## ✅ Pasos para Verificar

### Opción 1: Generar Error desde la Página de Prueba (Recomendado)

1. **Ve a tu aplicación en producción:**
   ```
   https://tu-dominio.vercel.app/sentry-example-page
   ```

2. **Haz clic en el botón:**
   - **"⚠️ Llamar myUndefinedFunction() - PRIMER ERROR"**

3. **Verifica en Sentry:**
   - Ve a: https://sentry.io/organizations/migraflix/issues/
   - Espera 5-10 segundos
   - Deberías ver un nuevo error aparecer

### Opción 2: Generar Error desde la Consola del Navegador

1. **Abre tu aplicación en producción** en el navegador
2. **Abre la consola del navegador** (F12)
3. **Ejecuta:**
   ```javascript
   throw new Error("Test error producción - " + new Date().toISOString());
   ```
4. **Verifica en Sentry** (espera 5-10 segundos)

### Opción 3: Usar el Endpoint de Prueba (API)

1. **Llama al endpoint:**
   ```
   https://tu-dominio.vercel.app/api/test-error
   ```
   (Necesitamos crear este endpoint)

## 🔍 Qué Verificar en Sentry

### 1. Ver el Error en el Dashboard

- **URL:** https://sentry.io/organizations/migraflix/issues/
- **Qué buscar:**
  - Título del error (ej: "ReferenceError: myUndefinedFunction is not defined")
  - Timestamp reciente
  - Tags: `environment: production`, `component: client` o `component: server`

### 2. Ver Detalles del Error

Haz clic en el error para ver:
- **Stack Trace** completo
- **URL** donde ocurrió
- **User Agent** (navegador)
- **Session Replay** (si está disponible)
- **Contexto** adicional

### 3. Verificar Tags y Metadata

En los detalles del error, verifica:
- ✅ `environment: production`
- ✅ `component: client` (si es del navegador) o `component: server` (si es del servidor)
- ✅ URL de la página donde ocurrió

## 🎯 Checklist de Verificación

- [ ] Error generado en producción
- [ ] Error visible en https://sentry.io/organizations/migraflix/issues/
- [ ] Error tiene el tag `environment: production`
- [ ] Stack trace completo disponible
- [ ] URL de la página visible en el contexto
- [ ] Timestamp coincide con el momento del error

## 🆘 Si No Ves el Error

### Verificar Variables de Entorno en Vercel

1. Ve a tu proyecto en Vercel
2. **Settings** → **Environment Variables**
3. Verifica que tengas:
   - `SENTRY_DSN` (para servidor)
   - `NEXT_PUBLIC_SENTRY_DSN` (para cliente)
4. Asegúrate de que estén configuradas para **Production**

### Verificar en la Consola del Navegador

1. Abre la consola (F12)
2. Ve a la pestaña **Network**
3. Filtra por "sentry" o "ingest"
4. Deberías ver un request POST a `*.ingest.sentry.io`
5. Si no aparece, el DSN no está configurado correctamente

### Verificar Build en Vercel

1. Ve a tu proyecto en Vercel
2. **Deployments** → Último deployment
3. Verifica que el build fue exitoso
4. Revisa los logs del build para ver si hay errores relacionados con Sentry

## 📊 Monitoreo Continuo

Una vez verificado, Sentry capturará automáticamente:
- ✅ Todos los errores de JavaScript no manejados
- ✅ Errores de React (componentes, hooks)
- ✅ Errores de API routes
- ✅ Errores de renderizado

Puedes ver todos los errores en tiempo real en:
**https://sentry.io/organizations/migraflix/issues/**

