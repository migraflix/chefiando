# Configuración de Sentry

## ✅ Pasos Completados

1. ✅ Instalado `@sentry/nextjs`
2. ✅ Creados archivos de configuración:
   - `sentry.client.config.ts` - Para código del cliente
   - `sentry.server.config.ts` - Para código del servidor
   - `sentry.edge.config.ts` - Para edge runtime
   - `instrumentation.ts` - Para inicialización automática
3. ✅ Actualizado `next.config.mjs` para habilitar instrumentación

## 🔑 Configuración del DSN

Necesitas agregar tu DSN de Sentry a las variables de entorno:

### 1. Obtén tu DSN de Sentry

1. Ve a tu proyecto en Sentry: https://sentry.io/
2. Navega a **Settings** → **Projects** → [Tu Proyecto]
3. Ve a **Client Keys (DSN)**
4. Copia el **DSN** (tiene formato: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

### 2. Agrega las variables de entorno

Agrega estas variables a tu archivo `.env.local`:

```bash
# Sentry DSN
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Nota:** 
- `SENTRY_DSN` se usa en el servidor y edge runtime
- `NEXT_PUBLIC_SENTRY_DSN` se usa en el cliente (navegador)

### 3. Variables de entorno en Vercel

Si estás usando Vercel, también agrega estas variables en:
1. Ve a tu proyecto en Vercel
2. **Settings** → **Environment Variables**
3. Agrega ambas variables (`SENTRY_DSN` y `NEXT_PUBLIC_SENTRY_DSN`)
4. Asegúrate de seleccionar los ambientes correctos (Production, Preview, Development)

## 🧪 Probar la Configuración

### Opción 1: Probar manualmente

Crea una página de prueba temporal para generar un error:

```typescript
// app/test-sentry/page.tsx
"use client";

export default function TestSentry() {
  const handleError = () => {
    throw new Error("Test error para Sentry");
  };

  return (
    <div>
      <button onClick={handleError}>Generar Error de Prueba</button>
    </div>
  );
}
```

### Opción 2: Usar la consola del navegador

Abre la consola del navegador y ejecuta:

```javascript
Sentry.captureException(new Error("Test error"));
```

## 📊 Configuración Avanzada (Opcional)

### Ajustar el Sample Rate

En producción, puedes reducir el `tracesSampleRate` para no enviar todas las transacciones:

```typescript
// sentry.client.config.ts y sentry.server.config.ts
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
```

### Filtrar Errores

Puedes filtrar errores que no quieres enviar:

```typescript
Sentry.init({
  // ... otras configuraciones
  beforeSend(event, hint) {
    // Filtrar errores específicos
    if (event.exception) {
      const error = hint.originalException;
      if (error && error.message?.includes('ChunkLoadError')) {
        return null; // No enviar este error
      }
    }
    return event;
  },
});
```

### Agregar Contexto del Usuario

Puedes agregar información del usuario a los errores:

```typescript
Sentry.setUser({
  id: "user-id",
  email: "user@example.com",
  username: "username",
});
```

## 🔍 Verificar que Funciona

1. Reinicia el servidor de desarrollo: `npm run dev`
2. Genera un error de prueba
3. Ve a tu dashboard de Sentry
4. Deberías ver el error aparecer en **Issues**

## 📝 Notas

- Los errores solo se enviarán si las variables de entorno están configuradas
- En desarrollo, puedes ver logs de Sentry en la consola si `debug: true`
- Session Replay está habilitado (grabará sesiones cuando haya errores)
- El sample rate está al 100% para desarrollo, considera reducirlo en producción

## 🆘 Solución de Problemas

### Los errores no aparecen en Sentry

1. Verifica que las variables de entorno estén configuradas correctamente
2. Revisa la consola del navegador para ver si hay errores de conexión
3. Asegúrate de que el DSN sea correcto y no tenga espacios extra
4. Verifica que tu proyecto de Sentry esté activo

### Error: "instrumentationHook is not enabled"

Si ves este error, asegúrate de que `next.config.mjs` tenga:

```javascript
experimental: {
  instrumentationHook: true,
}
```

### Errores en la compilación

Si hay errores de TypeScript, puedes ignorarlos temporalmente (ya está configurado en `next.config.mjs`), pero es mejor corregirlos.

