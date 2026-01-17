# 🔧 Solución: Sentry No Está Enviando Errores

## ✅ Checklist de Verificación

### 1. Verificar Variables de Entorno

Abre tu archivo `.env.local` y verifica que tengas:

```bash
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Importante:**
- ✅ Ambas variables deben tener el **mismo valor**
- ✅ No deben tener comillas (`"` o `'`)
- ✅ No deben tener espacios al inicio o final
- ✅ Deben empezar con `https://`

### 2. Reiniciar el Servidor

**CRÍTICO:** Después de agregar o modificar variables de entorno, **SIEMPRE** reinicia el servidor:

```bash
# Detén el servidor (Ctrl+C)
# Luego reinícialo:
npm run dev
```

### 3. Verificar en la Página de Debug

Visita la página de debug que creamos:

```
http://localhost:3000/debug/sentry
```

Esta página te mostrará:
- ✅ Si Sentry está inicializado
- ✅ Si el DSN está configurado
- ✅ Si el formato del DSN es correcto
- ✅ Opción para probar el envío

### 4. Revisar la Consola del Navegador

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Console**
3. Busca mensajes que empiecen con `[Sentry]` o `Sentry Logger`
4. Si ves errores en rojo, cópialos

### 5. Verificar que el DSN Sea Correcto

El DSN debe tener este formato:

```
https://[hash]@[org-id].ingest.[region].sentry.io/[project-id]
```

**Ejemplo:**
```
https://abc123def456@o4510658441379840.ingest.us.sentry.io/4510658460254208
```

## 🔍 Problemas Comunes y Soluciones

### Problema 1: "Sentry NO está inicializado"

**Causa:** El servidor no se reinició después de agregar el DSN

**Solución:**
1. Detén el servidor (Ctrl+C)
2. Reinicia: `npm run dev`
3. Recarga la página en el navegador

### Problema 2: "DSN NO encontrado en variables de entorno"

**Causa:** La variable no está en `.env.local` o tiene un nombre incorrecto

**Solución:**
1. Verifica que el archivo se llame exactamente `.env.local` (con el punto al inicio)
2. Verifica que esté en la raíz del proyecto (mismo nivel que `package.json`)
3. Verifica que la variable se llame exactamente `NEXT_PUBLIC_SENTRY_DSN` (con mayúsculas)

### Problema 3: "Formato del DSN: ❌ Inválido"

**Causa:** El DSN tiene un formato incorrecto

**Solución:**
1. Ve a Sentry y copia el DSN nuevamente
2. Asegúrate de copiar TODO el DSN (desde `https://` hasta el final)
3. No agregues espacios ni comillas

### Problema 4: Errores en la Consola del Navegador

**Causa:** Puede haber errores de CORS, red, o configuración

**Solución:**
1. Abre la consola (F12)
2. Ve a la pestaña **Network**
3. Filtra por "sentry"
4. Busca requests que fallen (aparecen en rojo)
5. Haz clic en ellos para ver el error

### Problema 5: Los Errores No Aparecen en Sentry

**Causa:** Puede ser un problema de red, CORS, o el DSN es incorrecto

**Solución:**
1. Verifica que el DSN sea del proyecto correcto en Sentry
2. Verifica que no haya bloqueadores de anuncios activos
3. Prueba en modo incógnito
4. Verifica la consola del navegador para errores

## 🧪 Prueba Paso a Paso

### Paso 1: Verificar Configuración

1. Ve a: `http://localhost:3000/debug/sentry`
2. Verifica que todo esté en verde (✅)

### Paso 2: Probar Envío

1. En la misma página, haz clic en **"Enviar Error de Prueba a Sentry"**
2. Deberías ver: "✅ Error enviado a Sentry"

### Paso 3: Verificar en Sentry

1. Ve a: https://sentry.io/organizations/migraflix/issues/
2. Espera 5-10 segundos
3. Deberías ver un nuevo error con el mensaje de prueba

### Paso 4: Probar desde la Consola

1. Abre la consola del navegador (F12)
2. Ejecuta:
   ```javascript
   Sentry.captureException(new Error("Test desde consola"));
   ```
3. Verifica en Sentry que aparezca el error

## 🔧 Debug Avanzado

### Habilitar Logs Detallados

Los logs de debug ya están habilitados en desarrollo. Deberías ver mensajes en la consola como:

```
[Sentry] [Log] Initializing Sentry...
[Sentry] [Log] Sentry initialized with DSN: https://...
```

Si no ves estos mensajes:
1. Verifica que `NODE_ENV=development` en `.env.local`
2. Verifica que el servidor esté en modo desarrollo

### Verificar Requests de Red

1. Abre la consola (F12)
2. Ve a **Network**
3. Filtra por "sentry" o "ingest"
4. Deberías ver requests a `*.ingest.sentry.io`
5. Si hay errores (código 400, 403, etc.), cópialos

## 📝 Notas Importantes

- ⚠️ **Siempre reinicia el servidor** después de cambiar variables de entorno
- ⚠️ Las variables que empiezan con `NEXT_PUBLIC_` son públicas (se exponen al cliente)
- ⚠️ El DSN es seguro de exponer públicamente (está diseñado para eso)
- ⚠️ Los errores pueden tardar 5-10 segundos en aparecer en Sentry

## 🆘 Si Nada Funciona

1. **Verifica el DSN en Sentry:**
   - Ve a: https://sentry.io/organizations/migraflix/projects/migraflix/keys/
   - Crea un nuevo DSN si es necesario
   - Copia el nuevo DSN y actualiza `.env.local`

2. **Reinstala Sentry:**
   ```bash
   npm uninstall @sentry/nextjs
   npm install @sentry/nextjs
   ```

3. **Limpia la caché:**
   ```bash
   rm -rf .next
   npm run dev
   ```

4. **Verifica la versión de Next.js:**
   - Sentry requiere Next.js 13+ con App Router
   - Tu versión: Next.js 16.0.7 ✅ (compatible)

