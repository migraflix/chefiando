---
titulo: "Login con Instagram + Multi-tenant + Publicación (Feed/Stories/Reels + Agendar)"
fecha: 2026-05-22
proyecto: chefiando
estado: draft
tipo: PRD
tags: [auth, instagram, multi-tenant, oauth, meta, publicación, stories, reels, scheduled-posts]
feature: F1
prioridad: P0
horas_estimadas: 102-134h (+ 16-32h App Review de Meta)
depende_de: []
---

# F1 — Login con Instagram + Multi-tenant + Publicación (Feed/Stories/Reels + Agendar)

> Sub-PRD del plan maestro `~/.claude/plans/tengo-que-planificar-estas-squishy-quiche.md`. Lee primero el plan maestro para contexto.
> **v2 — 2026-05-22:** absorbe Stories, Reels y posts agendados (antes out-of-scope, movidos a in-scope por decisión del cliente).

## 1. Contexto y problema

Hoy Migraflix es admin-only. El equipo de Chefiando entra con whitelist de emails (`lib/auth.ts:8`) y ve toda la data de todos los restaurantes. Los restaurantes (Brands en Airtable) no tienen cuenta propia. La publicación en Instagram es manual o vía n8n.

**Necesitamos** que cada restaurante entre con **su propia cuenta de Instagram**, vea **solo su Brand**, y pueda publicar contenido a su IG con **un clic**.

## 2. Outcome y métrica MAA

- **Medir:** % de Brands activos con login exitoso al menos 1 vez al mes / total Brands activos. Posts publicados desde la app vs vía n8n.
- **Analizar:** baseline hoy = 0% login (no existe). Comparar mes a mes después de lanzar.
- **Actuar:** si <40% de Brands logueados después de 30 días → onboarding/comunicación. Cerrar ciclo en `/cierre-semana`.

## 3. Scope

**In-scope:**
- OAuth con Instagram Business (vía Facebook Login).
- Detección Business vs Personal post-login.
- Match automático Brand ↔ cuenta IG por handle normalizado.
- Pantalla de vinculación manual cuando no hay match.
- Middleware multi-tenant nuevo (`/dashboard/*`).
- Dashboard home del restaurante (lista contenido propio).
- **Publicación de feed posts** a IG (`POST /api/restaurant/instagram/publish`).
- **Publicación de Stories** (24h, con sticker/link opcional).
- **Publicación de Reels** (video con caption + cover).
- **Agendamiento de posts** (cualquier tipo) con fecha+hora futura.
- Refresh automático de long-lived tokens (60 días).
- Logout.

**Out-of-scope:**
- Analytics de IG (eso es F4).
- Migración del admin actual (`/admin/*` sigue funcionando paralelo).
- Carouseles multi-imagen feed (Phase 2 si se pide).
- Editor de imágenes/video dentro de la app (sube ya armado).

## 4. Decisiones de diseño

| Decisión | Elección | Razón |
|----------|----------|-------|
| Cuentas Personal | Login OK, **publicación deshabilitada** con tooltip | Cliente confirmó: no forzar migración, no perder Brands |
| Ownership | 1 usuario IG = 1 Brand (1:1) | Cliente confirmó |
| Match | Normalizar `Instagram del negocio` (URL/handle) y comparar con `username` del token IG | Datos existen hoy en Airtable |
| Storage tokens | Encriptados en Airtable con clave en env `IG_TOKEN_ENCRYPTION_KEY` | Airtable no es secret-store; encriptamos al escribir |
| DB | Airtable (decisión plan maestro) | Sin migración a Supabase |

## 5. Diseño técnico

### Flow OAuth
```
[Restaurante en /dashboard/login]
   ↓ click "Entrar con Instagram"
[/api/auth/instagram] → redirect a Meta OAuth
   ↓ usuario autoriza
[/api/auth/instagram/callback]
   ↓ exchange code → short-lived token → long-lived token (60d)
   ↓ GET /me?fields=username,account_type
   ↓ detectar Business vs Personal
   ↓ normalizar username
   ↓ findBrandByInstagramId() o findBrandByHandle()
   ├─ match → guardar token, set cookie restaurant_token, redirect /dashboard
   └─ no match → redirect /dashboard/vincular (form que admin aprueba)
```

### Schema Airtable — campos nuevos en `Brands`

| Campo | Tipo | Notas |
|-------|------|-------|
| `instagram_user_id` | Text | ID de IG (numérico string) |
| `instagram_username` | Text | Handle (sin @) |
| `ig_access_token_encrypted` | Long text | Token long-lived encriptado |
| `ig_token_expires_at` | DateTime | Fecha de expiración (60 días desde emisión) |
| `can_publish` | Checkbox | True solo si Business + permiso `instagram_content_publish` |
| `last_login_at` | DateTime | Última vez que el restaurante entró |

### Cookie nueva
- `restaurant_token` (JWT) con payload: `{ brandId, instagram_user_id, instagram_username, can_publish }`. Vida: 7 días. Refresh on activity.

### Middleware
- Extender `middleware.ts:31` matcher con `/dashboard/:path*`.
- Si `pathname` empieza con `/dashboard/` y NO es `/dashboard/login` o `/dashboard/vincular` → validar `restaurant_token`.

### Files a modificar

| File | Cambio |
|------|--------|
| `lib/auth.ts:1-37` | Agregar `signRestaurantToken`, `verifyRestaurantToken`, `getRestaurantSession`. |
| `middleware.ts:1-34` | Extender matcher + lógica multi-cookie. |
| `lib/airtable/brands.ts:1-239` | Agregar `findBrandByInstagramId`, `findBrandByHandle`, `linkInstagramToBrand`, `updateLastLogin`. |

### Schema Airtable — `ScheduledPosts` (nueva tabla)

| Campo | Tipo | Notas |
|-------|------|-------|
| `brandId` | Link | A Brands |
| `media_type` | Select | feed / story / reel |
| `media_url` | URL | Foto o video (GCS) |
| `cover_url` | URL | Solo Reels |
| `caption` | Long text | Solo feed/reel |
| `scheduled_for` | DateTime | Cuándo publicar |
| `status` | Select | pending / publishing / published / failed / cancelled |
| `published_at` | DateTime | Nullable |
| `ig_media_id` | Text | ID que devuelve IG al publicar |
| `error_message` | Long text | Si falló |

### Endpoints de publicación

| Tipo | Endpoint | Flow IG Graph API |
|------|----------|-------------------|
| Feed (foto) | `POST /api/restaurant/instagram/publish` (`media_type=feed`) | `/{ig_user_id}/media` (image_url) → `/{ig_user_id}/media_publish` |
| Story | `POST /api/restaurant/instagram/publish` (`media_type=story`) | `/{ig_user_id}/media` (image_url, `media_type=STORIES`) → publish |
| Reel | `POST /api/restaurant/instagram/publish` (`media_type=reel`) | `/{ig_user_id}/media` (video_url, `media_type=REELS`, `cover_url`) → poll status `IN_PROGRESS/FINISHED` → publish |

### Cron de publicación agendada
- `/api/cron/publish-scheduled` — corre cada 5 minutos.
- Query `ScheduledPosts where status=pending AND scheduled_for <= now()`.
- Por cada row: marcar `status=publishing`, llamar endpoint correspondiente, actualizar `status=published` o `failed` con `error_message`.
- Reintenta hasta 3 veces antes de marcar `failed`. Notif al brand si falla definitivamente.

### Files nuevos
- `lib/instagram/oauth.ts` — wrapper de OAuth (build URL, exchange code, get long-lived).
- `lib/instagram/publish.ts` — `publishFeed`, `publishStory`, `publishReel`.
- `lib/instagram/scheduler.ts` — encolar / cancelar / listar agendados.
- `lib/instagram/token-refresh.ts` — cron de refresh.
- `lib/crypto/token-cipher.ts` — encriptar/desencriptar tokens (AES-256-GCM).
- `app/api/auth/instagram/route.ts` (iniciar OAuth).
- `app/api/auth/instagram/callback/route.ts`.
- `app/api/restaurant/instagram/publish/route.ts`.
- `app/api/restaurant/instagram/schedule/route.ts` (CRUD de agendados).
- `app/api/cron/publish-scheduled/route.ts` (cada 5 min).
- `app/api/cron/refresh-ig-tokens/route.ts` (diario).
- `app/dashboard/page.tsx`.
- `app/dashboard/login/page.tsx`.
- `app/dashboard/vincular/page.tsx`.
- `app/dashboard/publicar/page.tsx` (UI publicar/agendar con selector de tipo).
- `app/dashboard/agendados/page.tsx` (lista de posts pendientes).
- `app/dashboard/logout/route.ts`.

## 6. Tareas granulares

| # | Tarea | Horas |
|---|-------|-------|
| 1 | Setup App Meta + revisar permisos requeridos (incluye `instagram_content_publish` y permisos Stories/Reels) | 4 |
| 2 | Flow OAuth `/api/auth/instagram` + callback + cookie | 8 |
| 3 | Detección Business vs Personal + flag `can_publish` | 4 |
| 4 | Schema Airtable: 6 campos en `Brands` + tabla `ScheduledPosts` | 5 |
| 5 | Encriptación AES-256-GCM de tokens | 3 |
| 6 | `findBrandByInstagramId` + `findBrandByHandle` + match | 5 |
| 7 | Pantalla `/dashboard/login` | 4 |
| 8 | Pantalla `/dashboard/vincular` | 6 |
| 9 | Middleware multi-tenant: `restaurant_token` + `/dashboard/*` | 6 |
| 10 | Refactor APIs existentes para filtrar por `brandId` | 10 |
| 11 | Dashboard home `/dashboard` (lista contenido del brand) | 8 |
| 12 | Endpoint publicación **feed** + UI | 8 |
| 13 | Endpoint publicación **Story** (24h, sticker/link opcional) | 4 |
| 14 | Endpoint publicación **Reel** (video + cover + poll status) | 6 |
| 15 | UI `/dashboard/publicar` con selector de tipo + estados | 8 |
| 16 | Agendamiento: cron `/api/cron/publish-scheduled` + retries | 8 |
| 17 | UI `/dashboard/agendados` (lista + editar + cancelar) | 6 |
| 18 | Cron diario refresh long-lived token + alerta si falla | 5 |
| 19 | Logout + invalidación cookie | 2 |
| 20 | Tests E2E con cuenta de prueba (los 3 tipos + agendado) | 8 |
| 21 | Docs internas onboarding de Brand nuevo | 3 |
| 22 | App Review de Meta (someter + iteraciones) | 16-32 |
| **Total sin App Review** | | **122h** |
| **Rango con buffers** | | **102–134h** |

## 7. Supuestos y riesgos

**Supuestos críticos:**
- Meta aprueba `instagram_content_publish`. Si no → feature inviable, fallback manual.
- Airtable acepta tabla `ScheduledPosts` (sí, plan estándar).
- Reels: el video sube a GCS antes y se pasa URL pública a IG (IG no acepta upload directo).
- Vercel cron cada 5 min está disponible (plan Pro lo permite).

**Riesgos:**
- **App Review Meta** tarda 2–6 semanas (no contado en horas dev). Empezar pronto.
- **Tokens 60d expiran silenciosamente** → restaurante pierde acceso. Mitigación: alerta a admin si refresh falla 2 veces seguidas.
- **Handle de Airtable** no coincide con username real de IG → normalización robusta.
- **Reels processing async:** IG tarda 30s-5min en procesar un video. El cron debe poll status antes de "publish" final. Posts agendados pueden fallar si video todavía está en `IN_PROGRESS` cuando llega la hora — retry exponencial.
- **Stories caducan en 24h** y no se pueden editar — diseño UI debe avisar bien antes de publicar.

## 8. Verificación end-to-end

1. Crear App Meta en modo Development.
2. Brand de prueba con `Instagram del negocio = https://instagram.com/migraflix_test`.
3. Login desde `/dashboard/login` con cuenta IG Business → debe llegar a `/dashboard`.
4. Intentar acceder a `/dashboard` con otro IG → redirect a `/dashboard/vincular`.
5. **Publicar feed:** subir imagen → seleccionar tipo "Feed" → click "Publicar" → verificar post en IG real.
6. **Publicar Story:** seleccionar tipo "Story" → publicar → verificar Story en IG, debe caducar a las 24h.
7. **Publicar Reel:** subir video + cover → tipo "Reel" → publicar → poll status → verificar Reel publicado.
8. **Agendar:** subir contenido → elegir fecha+hora futura (5 min adelante) → guardar → esperar cron → verificar publicación.
9. Cancelar un post agendado → debe desaparecer de la lista y no publicarse.
10. Login con cuenta Personal → debe entrar, los 3 botones de publicar deshabilitados con tooltip.
11. Esperar 61 días o simular expiración → verificar que el cron refrescó el token.
12. Logout → verificar que cookie se elimina y `/dashboard` redirige a login.
