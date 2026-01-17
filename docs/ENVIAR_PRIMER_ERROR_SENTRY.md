# 🎯 Cómo Enviar el Primer Error a Sentry

## ✅ Pasos para Completar la Configuración

### Paso 1: Ve a la Página de Prueba

Abre en tu navegador:

```
http://localhost:3000/sentry-example-page
```

### Paso 2: Haz Clic en el Botón Principal

Verás un botón destacado en verde que dice:

**"⚠️ Llamar myUndefinedFunction() - PRIMER ERROR"**

Haz clic en ese botón.

### Paso 3: Verifica en la Consola

1. Abre la consola del navegador (F12)
2. Deberías ver estos mensajes:
   ```
   Error capturado por Sentry: ReferenceError: myUndefinedFunction is not defined
   Esperando confirmación de envío...
   ✅ Error enviado a Sentry
   ```

### Paso 4: Verifica en Sentry

1. Ve a: **https://sentry.io/organizations/migraflix/issues/**
2. Espera 5-10 segundos
3. **Recarga la página** si no ves el error inmediatamente
4. Deberías ver un nuevo error con el título: **"ReferenceError: myUndefinedFunction is not defined"**

### Paso 5: Completa la Configuración

Una vez que veas el error en Sentry:
1. Haz clic en el error para ver los detalles
2. Vuelve a la página de configuración de Sentry
3. Haz clic en **"Take me to my error"** o **"Continuar"**

## 🔍 Si No Ves el Error en Sentry

### Verificar en la Consola del Navegador

1. Abre la consola (F12)
2. Ve a la pestaña **Network**
3. Filtra por "sentry" o "ingest"
4. Busca un request a `*.ingest.sentry.io`
5. Haz clic en él y verifica:
   - **Status:** Debe ser `200` o `204` (éxito)
   - Si es `400` o `403`, hay un problema con el DSN

### Verificar el DSN

1. Ve a: `http://localhost:3000/debug/sentry`
2. Verifica que todo esté en verde (✅)
3. Si hay algo en rojo (❌), sigue las instrucciones que aparecen

### Verificar Variables de Entorno

Abre tu `.env.local` y verifica:

```bash
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Importante:**
- Ambas deben tener el mismo valor
- No deben tener comillas
- No deben tener espacios

### Reiniciar el Servidor

Si acabas de agregar el DSN:

1. Detén el servidor (Ctrl+C)
2. Reinicia: `npm run dev`
3. Recarga la página en el navegador
4. Intenta enviar el error nuevamente

## 🧪 Alternativa: Desde la Consola del Navegador

Si los botones no funcionan, puedes probar directamente desde la consola:

1. Abre la consola del navegador (F12)
2. Ejecuta exactamente esto:

```javascript
myUndefinedFunction();
```

Esto debería generar un error que Sentry capturará automáticamente.

## 📊 Verificar que el Error se Envió

### Método 1: Dashboard de Sentry

1. Ve a: https://sentry.io/organizations/migraflix/issues/
2. Busca un error con el título: **"ReferenceError: myUndefinedFunction is not defined"**
3. Si lo ves, ¡la configuración está completa! ✅

### Método 2: Network Tab

1. Abre la consola (F12)
2. Ve a **Network**
3. Filtra por "sentry"
4. Deberías ver un request POST a `*.ingest.sentry.io/api/.../store/`
5. El Status debe ser `200` o `204`

### Método 3: Console Logs

Si el debug está habilitado (lo está en desarrollo), verás mensajes como:

```
[Sentry] [Log] Sending event to Sentry...
[Sentry] [Log] Event sent successfully
```

## 🆘 Problemas Comunes

### "No veo el error en Sentry después de 30 segundos"

**Solución:**
1. Verifica que el DSN sea correcto en `/debug/sentry`
2. Revisa la consola del navegador para errores
3. Verifica en Network que haya un request exitoso a Sentry
4. Asegúrate de estar en el proyecto correcto en Sentry

### "Veo un error 403 en Network"

**Causa:** El DSN es incorrecto o no tiene permisos

**Solución:**
1. Ve a Sentry y verifica el DSN
2. Crea un nuevo DSN si es necesario
3. Actualiza `.env.local` con el nuevo DSN
4. Reinicia el servidor

### "No veo ningún request a Sentry en Network"

**Causa:** Sentry no se está inicializando

**Solución:**
1. Ve a `/debug/sentry` y verifica el estado
2. Reinicia el servidor
3. Verifica que las variables de entorno estén correctas

## ✅ Checklist Final

- [ ] DSN configurado en `.env.local`
- [ ] Servidor reiniciado después de agregar DSN
- [ ] Página `/sentry-example-page` carga correctamente
- [ ] Botón "Llamar myUndefinedFunction()" funciona
- [ ] Consola muestra "✅ Error enviado a Sentry"
- [ ] Request exitoso a Sentry en Network tab
- [ ] Error visible en https://sentry.io/organizations/migraflix/issues/
- [ ] Configuración completada en Sentry

