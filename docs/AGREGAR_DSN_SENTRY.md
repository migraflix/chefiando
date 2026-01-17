# Agregar DSN de Sentry Manualmente

## ✅ Estado Actual

- ✅ Sentry está instalado (`@sentry/nextjs@10.32.1`)
- ✅ Archivos de configuración creados
- ✅ El wizard falló por conflicto de dependencias (no afecta a Sentry)

## 🔑 Pasos para Agregar el DSN

### 1. Obtén tu DSN de Sentry

1. Ve a: **https://sentry.io/organizations/migraflix/projects/migraflix/**
2. Ve a: **Settings** → **Projects** → **migraflix**
3. En el menú lateral, busca **"Client Keys (DSN)"**
4. Copia el **DSN** (tiene formato: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

### 2. Agrega a `.env.local`

Abre tu archivo `.env.local` y agrega estas dos líneas:

```bash
# Sentry DSN
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Importante:** 
- Reemplaza `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx` con tu DSN real
- Ambas variables deben tener el mismo valor
- No agregues comillas ni espacios extra

### 3. Agrega en Vercel (si usas Vercel)

1. Ve a tu proyecto en Vercel
2. **Settings** → **Environment Variables**
3. Agrega:
   - **Name:** `SENTRY_DSN`
   - **Value:** (tu DSN)
   - **Environments:** Production, Preview, Development
4. Agrega:
   - **Name:** `NEXT_PUBLIC_SENTRY_DSN`
   - **Value:** (tu DSN - mismo valor)
   - **Environments:** Production, Preview, Development

### 4. Reinicia el servidor

```bash
npm run dev
```

### 5. Prueba que funciona

1. Visita: **http://localhost:3000/sentry-example-page**
2. Haz clic en "Generar Error Simple"
3. Ve a tu dashboard de Sentry: **https://sentry.io/organizations/migraflix/issues/**
4. El error debería aparecer en unos segundos

## 🔍 Verificar que el DSN está configurado

En la página `/sentry-example-page`, verás una sección que dice:
- ✅ **DSN Cliente: Configurado** (si está bien)
- ❌ **DSN Cliente: No configurado** (si falta)

## ⚠️ Nota sobre el Error del Wizard

El error que viste fue:
```
peer react@"^16.8 || ^17.0 || ^18.0" from vaul@0.9.9
```

Esto es porque `vaul` (una librería de UI) no es compatible con React 19, pero **NO afecta a Sentry**. Sentry funciona perfectamente con React 19.

## ✅ Listo

Una vez agregues el DSN, Sentry comenzará a capturar errores automáticamente. No necesitas el wizard.

