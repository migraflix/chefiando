# 📊 Cómo Ver los Errores en Sentry

## ✅ Si tu página muestra "Error enviado a Sentry" y "DSN Cliente: ✅ Configurado"

¡Perfecto! Todo está funcionando. Solo necesitas saber dónde ver los errores.

## 🔍 Pasos para Ver los Errores en Sentry

### 1. Ve a tu Dashboard de Sentry

**URL Directa:**
```
https://sentry.io/organizations/migraflix/issues/
```

O sigue estos pasos:

1. Ve a: **https://sentry.io/**
2. Inicia sesión con tu cuenta
3. Selecciona la organización: **migraflix**
4. En el menú lateral izquierdo, haz clic en **"Issues"** (o **"Problemas"**)

### 2. Ubicación Exacta en Sentry

Una vez dentro de Sentry:

```
┌─────────────────────────────────────────┐
│  Sentry Dashboard                       │
├─────────────────────────────────────────┤
│  [Sidebar]                              │
│  📊 Issues          ← HAZ CLIC AQUÍ    │
│  📈 Performance                          │
│  🔍 Discover                             │
│  ⚙️  Settings                            │
│                                         │
│  [Main Area]                            │
│  ┌─────────────────────────────────┐   │
│  │  Issues (Problemas)             │   │
│  │                                 │   │
│  │  🔴 myUndefinedFunction is not  │   │
│  │     defined                     │   │
│  │     hace 2 minutos             │   │
│  │                                 │   │
│  │  🔴 Test error para Sentry      │   │
│  │     hace 5 minutos             │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 3. Qué Buscar

En la página de **Issues**, deberías ver:

- **Título del error:** Por ejemplo: `myUndefinedFunction is not defined`
- **Cantidad de veces que ocurrió**
- **Última vez que ocurrió:** "hace X minutos"
- **Estado:** Nuevo, Resuelto, etc.

### 4. Ver Detalles de un Error

1. Haz clic en cualquier error de la lista
2. Verás:
   - **Stack trace** (dónde ocurrió el error)
   - **Contexto del navegador**
   - **URL donde ocurrió**
   - **Información del usuario** (si está disponible)
   - **Session Replay** (grabación de la sesión)

## 🧪 Verificar que los Errores Están Llegando

### Método 1: Generar un Error Único

1. Ve a: **http://localhost:3000/sentry-example-page**
2. Haz clic en **"🚨 Generar Error Simple"**
3. Espera 5-10 segundos
4. Ve a Sentry: **https://sentry.io/organizations/migraflix/issues/**
5. Deberías ver un nuevo error con el timestamp actual

### Método 2: Usar la Consola del Navegador

1. Abre la consola (F12)
2. Ejecuta:
   ```javascript
   throw new Error("Test único " + Date.now());
   ```
3. Ve a Sentry y busca el error con ese mensaje único

### Método 3: Verificar en la Consola

Abre la consola del navegador (F12) y busca mensajes como:
- `Sentry Logger: [Log] ...`
- Si `debug: true` está activado, verás más información

## 🔧 Si NO Ves Errores en Sentry

### Verificar el DSN

1. Ve a: **https://sentry.io/organizations/migraflix/projects/migraflix/**
2. **Settings** → **Projects** → **migraflix**
3. En el menú lateral, busca **"Client Keys (DSN)"**
4. Verifica que el DSN en `.env.local` coincida con el de Sentry

### Verificar Variables de Entorno

Asegúrate de que en `.env.local` tengas:

```bash
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Importante:** 
- Ambos deben tener el mismo valor
- No deben tener comillas
- No deben tener espacios al inicio o final

### Habilitar Debug (Temporalmente)

Para ver más información, puedes habilitar el debug temporalmente:

1. Edita `sentry.client.config.ts`:
   ```typescript
   debug: true,  // Cambiar de false a true
   ```

2. Reinicia el servidor
3. Abre la consola del navegador
4. Deberías ver logs de Sentry

## 📍 URLs Importantes

- **Dashboard de Issues:** https://sentry.io/organizations/migraflix/issues/
- **Configuración del Proyecto:** https://sentry.io/organizations/migraflix/projects/migraflix/
- **Client Keys (DSN):** https://sentry.io/organizations/migraflix/projects/migraflix/keys/

## ✅ Checklist

- [ ] DSN configurado en `.env.local`
- [ ] Servidor reiniciado después de agregar DSN
- [ ] Error generado desde la página de prueba
- [ ] Esperado 5-10 segundos
- [ ] Revisado en: https://sentry.io/organizations/migraflix/issues/
- [ ] Error visible en la lista de Issues

## 🆘 Si Aún No Funciona

1. **Verifica que estés en el proyecto correcto:**
   - Organización: `migraflix`
   - Proyecto: `migraflix`

2. **Verifica que el DSN sea correcto:**
   - Debe empezar con `https://`
   - Debe tener formato: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

3. **Revisa la consola del navegador:**
   - Busca errores relacionados con Sentry
   - Verifica que no haya errores de CORS

4. **Prueba con un error simple:**
   ```javascript
   // En la consola del navegador
   Sentry.captureException(new Error("Test manual"));
   ```

