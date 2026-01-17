# ✅ Configuración Completa de Sentry

## 🎯 Resumen

Sentry está completamente configurado y capturará automáticamente todos los errores en tu aplicación con el máximo contexto posible.

## 📊 Qué se Captura Automáticamente

### ✅ Errores del Cliente (Navegador)

- **Errores de JavaScript** no manejados
- **Errores de React** (componentes, hooks, etc.)
- **Errores de red** (fetch, axios, etc.)
- **Errores asíncronos** (promesas rechazadas)
- **Errores de renderizado** (Error Boundaries)
- **Session Replay** cuando hay errores (grabación de la sesión)

### ✅ Errores del Servidor

- **Errores en API routes** (`/api/*`)
- **Errores en Server Components**
- **Errores en Server Actions**
- **Errores de base de datos** (Airtable, etc.)

### 📝 Información Capturada Automáticamente

Para cada error, Sentry captura:

1. **Stack Trace Completo**
   - Línea exacta donde ocurrió el error
   - Archivo y función
   - Llamadas anteriores (call stack)

2. **Contexto del Navegador**
   - User Agent
   - Idioma del navegador
   - URL donde ocurrió el error
   - Resolución de pantalla

3. **Contexto del Usuario** (si está disponible)
   - ID de usuario
   - Email
   - Nombre de usuario

4. **Tags Útiles**
   - `component`: "client" o "server"
   - `environment`: "development" o "production"

5. **Session Replay** (solo en errores del cliente)
   - Grabación de lo que el usuario estaba haciendo
   - Interacciones antes del error
   - Estado de la página

## 🔧 Configuración Actual

### Cliente (`sentry.client.config.ts`)

- ✅ DSN configurado
- ✅ Session Replay habilitado
- ✅ Browser Tracing habilitado
- ✅ Captura de errores no manejados
- ✅ Filtrado de errores irrelevantes
- ✅ Contexto automático agregado

### Servidor (`sentry.server.config.ts`)

- ✅ DSN configurado
- ✅ Captura de errores no manejados
- ✅ Contexto de request agregado
- ✅ Tags automáticos

### Error Boundary (`app/error.tsx`)

- ✅ Captura errores de renderizado
- ✅ Reporta automáticamente a Sentry
- ✅ UI amigable para el usuario

## 📍 Dónde Ver los Errores

### Dashboard Principal

```
https://sentry.io/organizations/migraflix/issues/
```

### Filtros Útiles

- **Por ambiente:** `environment:development` o `environment:production`
- **Por componente:** `component:client` o `component:server`
- **Por nivel:** `level:error`, `level:warning`, `level:info`

## 🎨 Agregar Contexto Adicional (Opcional)

Si quieres agregar más información a los errores, puedes usar:

### En el Cliente

```typescript
import * as Sentry from "@sentry/nextjs";

// Agregar información del usuario
Sentry.setUser({
  id: "user-123",
  email: "usuario@example.com",
  username: "usuario",
});

// Agregar tags personalizados
Sentry.setTag("feature", "checkout");
Sentry.setTag("page", "productos");

// Agregar contexto adicional
Sentry.setContext("shopping_cart", {
  items: 3,
  total: 150.00,
  currency: "USD",
});
```

### En el Servidor (API Routes)

```typescript
import * as Sentry from "@sentry/nextjs";

export async function GET(request: NextRequest) {
  try {
    // Tu código aquí
  } catch (error) {
    // Agregar contexto antes de capturar
    Sentry.setContext("api_request", {
      endpoint: "/api/brands",
      method: "GET",
      timestamp: new Date().toISOString(),
    });
    
    Sentry.captureException(error);
    throw error;
  }
}
```

## 📊 Métricas y Monitoreo

Sentry también captura automáticamente:

- **Performance** (tiempo de carga, queries lentas)
- **Transacciones** (navegación entre páginas)
- **Sesiones** (usuarios activos)

Puedes ver estas métricas en:
```
https://sentry.io/organizations/migraflix/performance/
```

## 🔔 Alertas (Opcional)

Puedes configurar alertas en Sentry para:

- Recibir emails cuando hay errores nuevos
- Notificaciones en Slack
- Webhooks a otros servicios

Configuración: **Settings → Alerts**

## 🧹 Limpieza de Errores

### Errores Filtrados Automáticamente

Estos errores NO se envían a Sentry (son comunes y no útiles):

- Errores de red genéricos
- Errores de extensiones del navegador
- Errores de scripts de terceros

### Filtrar Errores Personalizados

Si quieres filtrar más errores, edita `sentry.client.config.ts`:

```typescript
ignoreErrors: [
  'Error específico que no quieres ver',
  // ... más errores
],
```

## ✅ Checklist de Verificación

- [x] Sentry inicializado en cliente
- [x] Sentry inicializado en servidor
- [x] Error Boundary configurado
- [x] Session Replay habilitado
- [x] Contexto automático agregado
- [x] Errores no manejados capturados
- [x] Tags y metadata automáticos

## 🎯 Próximos Pasos

1. **Monitorea los errores** en el dashboard de Sentry
2. **Revisa los errores** y corrígelos según aparezcan
3. **Configura alertas** si quieres notificaciones
4. **Revisa Session Replays** para entender mejor los errores

## 📚 Recursos

- **Documentación de Sentry:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Dashboard:** https://sentry.io/organizations/migraflix/
- **Issues:** https://sentry.io/organizations/migraflix/issues/
- **Performance:** https://sentry.io/organizations/migraflix/performance/

---

**¡Todo está listo!** Cualquier error que ocurra en tu aplicación será capturado automáticamente con toda la información necesaria para debuggearlo. 🎉

