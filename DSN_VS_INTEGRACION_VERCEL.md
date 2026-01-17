# 🔑 DSN vs Integración de Vercel

## ⚠️ Diferencia Importante

La URL que viste:
```
https://o4510658441379840.ingest.us.sentry.io/api/4510658460254208/integration/vercel/logs/
```

**NO es el DSN** que necesitas. Esta es una URL de **integración de Vercel** para logs del servidor.

## ✅ El DSN que Necesitas

El DSN para tu aplicación Next.js tiene este formato:

```
https://[hash]@o4510658441379840.ingest.us.sentry.io/[project-id]
```

**Ejemplo:**
```
https://abc123def456@o4510658441379840.ingest.us.sentry.io/4510658460254208
```

## 🔍 Cómo Encontrar el DSN Correcto

### Opción 1: Desde la URL de Integración (Pista)

Basándome en la URL que viste, tu organización y proyecto son:
- **Organización ID:** `o4510658441379840`
- **Proyecto ID:** `4510658460254208`
- **Región:** `us` (Estados Unidos)

El DSN debería estar en:

**URL Directa:**
```
https://sentry.io/organizations/[tu-org]/projects/[tu-proyecto]/keys/
```

### Opción 2: Pasos Detallados

1. **Ve a tu proyecto en Sentry:**
   - https://sentry.io/organizations/migraflix/projects/migraflix/

2. **Ve a Settings:**
   - Haz clic en **⚙️ Settings** en el menú lateral

3. **Busca "Client Keys (DSN)":**
   - En el menú de Settings, busca **"Client Keys (DSN)"** o **"Keys"**
   - Haz clic ahí

4. **Copia el DSN:**
   - Verás una lista de DSNs
   - Haz clic en **"Show"** o **"Reveal"** para ver el DSN completo
   - El DSN debería verse así: `https://xxxxx@o4510658441379840.ingest.us.sentry.io/4510658460254208`

### Opción 3: Crear un Nuevo DSN

Si no encuentras uno existente:

1. Ve a: **Settings** → **Client Keys (DSN)**
2. Haz clic en **"Create New Key"** o **"Generate New DSN"**
3. Dale un nombre: "Next.js App" o "Migraflix Web"
4. Copia el DSN que se genera

## 📝 Configuración en `.env.local`

Una vez que tengas el DSN, agrégalo a tu `.env.local`:

```bash
# Sentry DSN (reemplaza con tu DSN real)
SENTRY_DSN=https://xxxxx@o4510658441379840.ingest.us.sentry.io/4510658460254208
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@o4510658441379840.ingest.us.sentry.io/4510658460254208
```

**Importante:**
- Reemplaza `xxxxx` con el hash real que te da Sentry
- Ambas variables deben tener el mismo valor
- No agregues comillas ni espacios

## 🔗 URLs Útiles

- **Client Keys (DSN):** https://sentry.io/organizations/migraflix/projects/migraflix/keys/
- **Settings del Proyecto:** https://sentry.io/organizations/migraflix/projects/migraflix/settings/
- **Integración de Vercel:** (Esta es diferente, para logs del servidor)

## ✅ Verificar que Funciona

Después de agregar el DSN:

1. Reinicia el servidor: `npm run dev`
2. Ve a: http://localhost:3000/sentry-example-page
3. Verifica que diga: **"DSN Cliente: ✅ Configurado"**
4. Genera un error de prueba
5. Ve a Sentry para ver el error: https://sentry.io/organizations/migraflix/issues/

## 🆘 Si Aún No Lo Encuentras

### Buscar en la Configuración de Vercel

Si configuraste la integración de Vercel, el DSN podría estar en:

1. Ve a tu proyecto en Vercel
2. **Settings** → **Integrations** → **Sentry**
3. Ahí deberías ver el DSN configurado

### Contactar Soporte

Si no puedes encontrar el DSN, puedes:
- Crear un nuevo proyecto en Sentry
- O contactar el soporte de Sentry

