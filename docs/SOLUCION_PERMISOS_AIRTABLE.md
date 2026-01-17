# 🔧 Solución: Error 403 - Permisos de Airtable

## Diagnóstico

Tu API Key es válida y funciona, pero **no tiene permisos para acceder a la base específica**.

### Estado Actual:
- ✅ Token válido (WhoAmI funciona)
- ✅ Puede listar bases (tiene acceso general)
- ❌ **NO puede acceder a la base `apprcC...` (403)**
- ❌ **NO puede listar tablas de esa base (403)**

## Solución: Dar Permisos al Token en Airtable

### Opción 1: Personal Access Token (Recomendado)

1. **Ve a tu cuenta de Airtable:**
   - https://airtable.com/account
   - O haz clic en tu perfil → Account

2. **Ve a la sección de Tokens:**
   - Busca "Developer" o "Personal access tokens"
   - O ve directamente a: https://airtable.com/create/tokens

3. **Crea un nuevo token O edita el existente:**
   - Si creas uno nuevo, dale un nombre descriptivo (ej: "Migraflix Local Dev")
   - **IMPORTANTE:** En la sección "Access", selecciona:
     - ✅ La base específica que necesitas (debería aparecer en la lista)
     - ✅ Permisos: `data.records:read` y `data.records:write`
     - ✅ Opcionalmente: `schema.bases:read` para poder listar tablas

4. **Copia el nuevo token:**
   - El token empieza con `pat...`
   - Cópialo completo (sin espacios)

5. **Actualiza tu `.env.local`:**
   ```env
   AIRTABLE_API_KEY=patxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   AIRTABLE_BASE_ID=apprcCvYyrWqDXKay
   ```

6. **Reinicia el servidor:**
   ```bash
   # Detén el servidor (Ctrl+C)
   npm run dev
   ```

### Opción 2: Verificar Permisos del Token Existente

Si ya tienes un token y quieres verificar sus permisos:

1. Ve a: https://airtable.com/create/tokens
2. Busca tu token en la lista
3. Haz clic en "Edit" o "View"
4. Verifica que:
   - ✅ La base `apprcCvYyrWqDXKay` esté en la lista de bases accesibles
   - ✅ Tenga los permisos necesarios (read/write)

### Opción 3: Usar API Key de Workspace (Si aplica)

Si estás usando un workspace de Airtable:

1. Ve a tu workspace
2. Settings → API
3. Crea o usa un API Key del workspace
4. Asegúrate de que tenga acceso a la base

## Verificación

Después de actualizar el token:

1. Ve a: `http://localhost:3000/debug/airtable`
2. Haz clic en "Probar Permisos"
3. Deberías ver:
   - ✅ Verificar Token (WhoAmI): 200
   - ✅ Listar Bases: 200
   - ✅ **Acceder a Base: 200** (antes era 403)
   - ✅ **Listar Tablas de la Base: 200** (antes era 403)

## Notas Importantes

- **Cada token es específico por base**: Un token puede tener acceso a algunas bases pero no a otras
- **Los tokens no se pueden "compartir" entre bases**: Necesitas darle acceso explícito a cada base
- **En producción funciona**: Probablemente porque el token de producción tiene acceso a esa base, pero el de desarrollo no

## Si el Problema Persiste

1. **Verifica que el Base ID sea correcto:**
   - En Airtable, ve a tu base
   - Help → API documentation
   - Copia el Base ID (debería ser `apprcCvYyrWqDXKay`)

2. **Verifica que estés usando el mismo token en producción:**
   - Si en producción funciona, copia exactamente ese token
   - Asegúrate de que tenga los mismos permisos

3. **Crea un token nuevo desde cero:**
   - A veces es más fácil crear uno nuevo con los permisos correctos
   - Elimina el viejo si ya no lo necesitas

---

**Última actualización:** [Fecha actual]


