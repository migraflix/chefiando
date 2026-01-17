# Configurar Sentry - Guía Rápida

## ✅ Configuración Manual (Ya Completada)

Ya tenemos todos los archivos de Sentry configurados:
- ✅ `sentry.client.config.ts`
- ✅ `sentry.server.config.ts`
- ✅ `sentry.edge.config.ts`
- ✅ `instrumentation.ts`
- ✅ `next.config.mjs` actualizado

## 🔑 Solo Necesitas Agregar el DSN

### Opción A: Usar el Wizard (Recomendado)

Ejecuta esto en tu terminal local (no en Cursor):

```bash
npx @sentry/wizard@latest -i nextjs --saas --org migraflix --project migraflix
```

El wizard te pedirá:
1. Tu autenticación de Sentry (si no estás logueado)
2. Confirmar la organización y proyecto
3. Automáticamente agregará el DSN a tus variables de entorno

### Opción B: Agregar Manualmente

Si prefieres hacerlo manualmente:

1. **Obtén tu DSN de Sentry:**
   - Ve a https://sentry.io/
   - Settings → Projects → migraflix
   - Client Keys (DSN)
   - Copia el DSN (formato: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

2. **Agrega a `.env.local`:**
   ```bash
   SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```

3. **Agrega también en Vercel:**
   - Ve a tu proyecto en Vercel
   - Settings → Environment Variables
   - Agrega ambas variables para Production, Preview y Development

## 🧪 Probar que Funciona

Después de agregar el DSN, reinicia el servidor:

```bash
npm run dev
```

Luego, crea un error de prueba en la consola del navegador:

```javascript
// Abre la consola (F12) y ejecuta:
throw new Error("Test Sentry");
```

Deberías ver el error aparecer en tu dashboard de Sentry en unos segundos.

## 📝 Nota

El wizard puede sobrescribir algunos archivos que ya creamos, pero eso está bien. La configuración será compatible.

