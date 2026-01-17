# 🔑 Cómo Obtener el DSN de Sentry

## 📍 Ubicación Exacta del DSN en Sentry

### Paso 1: Ve a tu Proyecto en Sentry

**URL Directa:**
```
https://sentry.io/organizations/migraflix/projects/migraflix/
```

O sigue estos pasos:

1. Ve a: **https://sentry.io/**
2. Inicia sesión
3. Selecciona la organización: **migraflix** (arriba a la izquierda)
4. En el menú lateral, busca y haz clic en **"Projects"** (o "Proyectos")
5. Haz clic en el proyecto: **migraflix**

### Paso 2: Ve a Settings (Configuración)

Una vez en el proyecto, verás un menú lateral. Busca y haz clic en:

**⚙️ Settings** (o "Configuración")

### Paso 3: Busca "Client Keys (DSN)"

En el menú de Settings, verás varias opciones. Busca y haz clic en:

**🔑 Client Keys (DSN)**

**Ubicación en el menú:**
```
Settings
├── General
├── Alerts
├── Client Keys (DSN)  ← HAZ CLIC AQUÍ
├── Security Headers
├── Source Maps
└── ...
```

### Paso 4: Copia el DSN

En la página de "Client Keys (DSN)", verás:

1. **Una lista de DSNs** (puede haber uno o varios)
2. Cada DSN tiene este formato:
   ```
   https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```
3. **Haz clic en el botón "Show"** o **"Reveal"** para ver el DSN completo
4. **Copia el DSN** completo (desde `https://` hasta el final)

### Paso 5: Agrega el DSN a tu Proyecto

Abre tu archivo `.env.local` (en la raíz del proyecto) y agrega:

```bash
# Sentry DSN
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Importante:**
- Reemplaza `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx` con el DSN real que copiaste
- **Ambas variables deben tener el mismo valor**
- No agregues comillas (`"` o `'`)
- No agregues espacios al inicio o final

### Paso 6: Reinicia el Servidor

Después de agregar el DSN, reinicia tu servidor de desarrollo:

```bash
npm run dev
```

## 🖼️ Visualización de la Ubicación

```
┌─────────────────────────────────────────────────────────┐
│  Sentry - migraflix / migraflix                        │
├─────────────────────────────────────────────────────────┤
│  [Sidebar]                    [Main Area]              │
│  📊 Issues                     ┌─────────────────────┐ │
│  📈 Performance                │                     │ │
│  🔍 Discover                   │  Client Keys (DSN)   │ │
│  ⚙️  Settings  ← AQUÍ          │                     │ │
│    ├── General                 │  DSN:                │ │
│    ├── Alerts                  │  https://xxxxx@...  │ │
│    └── Client Keys (DSN) ← AQUÍ│                     │ │
│                                │  [Show] [Copy]       │ │
│                                └─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🔍 Si No Encuentras "Client Keys (DSN)"

### Alternativa 1: Buscar en "Keys"

Algunas versiones de Sentry lo llaman simplemente **"Keys"**:

1. Ve a: **Settings** → **Keys**
2. Busca el DSN allí

### Alternativa 2: Crear un Nuevo DSN

Si no tienes un DSN, puedes crear uno:

1. Ve a: **Settings** → **Client Keys (DSN)**
2. Haz clic en **"Create New Key"** o **"Generate New DSN"**
3. Dale un nombre (ej: "Next.js App")
4. Copia el DSN que se genera

### Alternativa 3: Ver en la URL del Wizard

Si ejecutaste el wizard de Sentry, el DSN podría estar en:
- La URL que te dio el wizard
- Los logs del wizard
- Un archivo `.sentryclirc` (si se creó)

## ✅ Verificar que el DSN Está Correcto

Después de agregar el DSN, puedes verificar en:

1. **Página de prueba:** http://localhost:3000/sentry-example-page
2. Busca la sección **"🔍 Verificar Configuración"**
3. Debería decir: **"DSN Cliente: ✅ Configurado"**

## 🆘 Si Aún No Lo Encuentras

### Opción 1: Contactar Soporte de Sentry

Si no puedes encontrar el DSN, puedes:
1. Ir a: https://sentry.io/support/
2. O crear un nuevo proyecto en Sentry

### Opción 2: Crear un Nuevo Proyecto

Si es más fácil, puedes crear un nuevo proyecto:

1. Ve a: https://sentry.io/organizations/migraflix/projects/new/
2. Selecciona: **Next.js**
3. Sigue los pasos
4. El DSN se mostrará al final

## 📝 Formato del DSN

El DSN tiene este formato exacto:

```
https://[hash]@[organization].ingest.sentry.io/[project-id]
```

Ejemplo:
```
https://abc123def456@o1234567.ingest.sentry.io/1234567
```

**No debe tener:**
- Espacios
- Comillas
- Saltos de línea
- Caracteres extra al inicio o final

## 🔗 Enlaces Útiles

- **Dashboard del Proyecto:** https://sentry.io/organizations/migraflix/projects/migraflix/
- **Client Keys (DSN):** https://sentry.io/organizations/migraflix/projects/migraflix/keys/
- **Settings del Proyecto:** https://sentry.io/organizations/migraflix/projects/migraflix/settings/

