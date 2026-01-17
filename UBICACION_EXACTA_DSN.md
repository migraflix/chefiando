# 📍 Ubicación EXACTA del DSN en Sentry

## 🎯 Estás en la Pestaña Incorrecta

Actualmente estás en: **Settings → General**

El DSN **NO está en "General"**, está en otra sección.

## ✅ Pasos Exactos para Encontrar el DSN

### Paso 1: Desde donde estás ahora

Estás en:
```
Settings → Proyecto → General
```

### Paso 2: Busca en el Menú Lateral de Settings

En el menú lateral izquierdo, dentro de **Settings**, busca una de estas opciones:

1. **"Client Keys (DSN)"** ← ESTA ES LA CORRECTA
2. **"Keys"** (algunas versiones lo llaman así)
3. **"Client Keys"**

**Ubicación en el menú:**
```
Settings (⚙️)
├── General          ← Estás aquí
├── Alerts
├── Client Keys (DSN) ← ¡HAZ CLIC AQUÍ!
├── Security Headers
├── Source Maps
└── ...
```

### Paso 3: Si No Ves "Client Keys (DSN)" en el Menú

**Opción A: Buscar en "Security & Privacy"**
1. En el menú de Settings, busca **"Security & Privacy"**
2. Dentro de ahí, busca **"Client Keys"** o **"DSN"**

**Opción B: Usar la URL Directa**

Copia y pega esta URL en tu navegador:

```
https://sentry.io/organizations/migraflix/projects/migraflix/keys/
```

O si estás en la región US:

```
https://migraflix.sentry.io/settings/projects/migraflix/keys/
```

### Paso 4: Una Vez que Estés en "Client Keys (DSN)"

Verás:
- Una lista de DSNs (puede haber uno o varios)
- Cada uno tiene un nombre (ej: "Default", "Next.js App", etc.)
- Un botón **"Show"** o **"Reveal"** para ver el DSN completo
- Haz clic en **"Show"** para revelar el DSN
- Copia el DSN completo

## 🔍 URL Directa (Copia y Pega)

Si no encuentras el menú, usa esta URL directamente:

```
https://migraflix.sentry.io/settings/projects/migraflix/keys/
```

O esta:

```
https://sentry.io/organizations/migraflix/projects/migraflix/keys/
```

## 📝 Formato del DSN que Buscas

El DSN debería verse así:

```
https://[hash]@o4510658441379840.ingest.us.sentry.io/4510658460254208
```

O si es otra región:

```
https://[hash]@[org-id].ingest.sentry.io/[project-id]
```

**Ejemplo real:**
```
https://abc123def456ghi789@o4510658441379840.ingest.us.sentry.io/4510658460254208
```

## 🆘 Si Aún No Lo Encuentras

### Crear un Nuevo DSN

1. Ve a: **Settings** → **Client Keys (DSN)**
2. Si no hay ningún DSN, haz clic en **"Create New Key"** o **"Create New DSN"**
3. Dale un nombre: "Next.js App" o "Migraflix Web"
4. Haz clic en **"Create"**
5. Se mostrará el DSN nuevo - **¡CÓPIALO INMEDIATAMENTE!** (solo se muestra una vez)
6. Si lo pierdes, tendrás que crear uno nuevo

### Verificar Permisos

Si no ves la opción "Client Keys", puede ser un tema de permisos:
- Asegúrate de tener permisos de **Admin** o **Owner** en el proyecto
- Si no los tienes, pide a un administrador que te dé acceso

## ✅ Una Vez que Tengas el DSN

Agrégalo a tu `.env.local`:

```bash
SENTRY_DSN=https://xxxxx@o4510658441379840.ingest.us.sentry.io/4510658460254208
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@o4510658441379840.ingest.us.sentry.io/4510658460254208
```

Reemplaza `xxxxx` con el hash real del DSN.

