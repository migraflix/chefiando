---
title: "Cotización Desarrollador — Migraflix / Chefiando"
subtitle: "4 Features para validación y estimado"
author: "GNB Labs — Gabriel Neuman"
date: "22 de mayo, 2026"
---

# Cotización Desarrollador — Migraflix / Chefiando

**Cliente final:** Chefiando (alias Migraflix)
**Proyecto:** Plataforma multi-tenant + IA + SEO automatizado
**Fecha del documento:** 22 de mayo, 2026
**Para:** Desarrollador asignado (validación de estimado)

---

## Cómo leer este documento

Este PDF describe **4 features** que vamos a construir sobre el repo `migraflix/chefiando` actual. Para cada una verás:

1. Contexto y objetivo de negocio.
2. Diseño técnico (arquitectura, schemas, files a tocar).
3. **Tabla de tareas granulares** con columna vacía "Estimado dev" para que la llenes.
4. Riesgos y supuestos.

Al final del PDF hay una **hoja de firma** para cerrar la cotización.

**Tu trabajo:**
- Revisar cada tarea.
- Llenar la columna "Estimado dev" con tus horas reales.
- Si una tarea te toma 0h porque algo ya existe, márcala como tal y aclaralo.
- Si detectás tareas que faltan, agregalas al final de cada tabla.
- Llenar la sección "Supuestos del dev" al final de cada feature si hay algo que cambia el alcance.

---

## Contexto del Proyecto

### Qué es Migraflix / Chefiando

Plataforma que ayuda a restaurantes con:
- Gestión de contenido (fotos, copy) generado por IA.
- Publicación en Instagram.
- Próximamente: bots de atención al cliente, SEO automatizado, presencia en directorios.

Hoy es **admin-only**: el equipo de Chefiando edita en una interfaz web (`/admin/*`) la data que se publica luego en IG (vía n8n + flujos manuales).

**Volumen actual:** ~500 brands en Airtable, ~10k contenidos.

### Stack actual del repo

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Frontend | Next.js 16.0.7 + React 19.1.0 | App Router |
| UI | Tailwind 4.1.9 + Radix UI + shadcn | Recharts disponible |
| Backend | Next.js API routes | Node runtime |
| DB | Airtable (`apprcCvYyrWqDXKay`) | 3 tablas hoy: `Brands`, `Content`, `Fotos AI` |
| Auth | JWT custom con whitelist de emails | Cookie `admin_token`, sin multi-tenant |
| Storage | Google Cloud Storage | Imágenes |
| Observabilidad | Sentry (`@sentry/nextjs ^10.34.0`) | Instalado, DSN puede no estar en prod |
| Workflows externos | n8n | Consume webhooks para flujo de imágenes AI |
| Hosting | Vercel | Plan a confirmar (Pro requerido por F4) |

### Archivos clave del repo

| Archivo | Propósito | Para qué tocarlo |
|---------|-----------|------------------|
| `lib/auth.ts` (37 líneas) | JWT admin + cookie `admin_token` | Extender con sesión de restaurante (F1) |
| `middleware.ts` (34 líneas) | Protege `/admin/*` | Extender con `/dashboard/*` (F1) + host routing (F4) |
| `lib/airtable/brands.ts` (239 líneas) | CRUD de Brands | Agregar funciones de query por IG user (F1) |
| `lib/airtable/utils.ts` | Helpers Airtable | Reusar para nuevas tablas |
| `sentry.client.config.ts` (78 líneas) | Config Sentry frontend | Auditar (F3) |
| `app/admin/*` | UI admin actual | Refactor para coexistir con `/dashboard/*` (F1) |
| `app/api/admin/*` | APIs admin | Refactor para filtrar por brandId (F1) |

### Cómo levantar el dev env

```bash
git clone <repo>
cd chefiando
npm install
cp .env.example .env.local  # pedir credenciales a Gabriel
npm run dev
```

Variables clave: `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `NEXTAUTH_SECRET`, `ADMIN_EMAILS`, `NEXT_PUBLIC_SENTRY_DSN`, `GCS_*`.

---

## Decisiones ya tomadas (no re-discutir, solo aplicar)

| Decisión | Aplica a | Detalle |
|----------|----------|---------|
| DB = Airtable para todo | Todas | No migrar a Supabase. Trigger de migración futura: >1.500 brands o >30k conversaciones/mes. |
| IG cuentas mixtas | F1 | Personal puede entrar pero NO publicar (botón deshabilitado, tooltip). Business publica. |
| Ownership IG → Brand | F1 | 1:1. Match por `instagram_user_id` o normalización del campo `Instagram del negocio`. |
| Stack bots | F2 | WhatsApp: SendPulse (ya en uso). Voz: nlpearl. LLM: Claude Haiku 4.5. |
| Sin billing | F2, F4 | Chefiando absorbe los costos variables de bots, GMB, listings. No medimos uso por brand en este lote. |
| GMB respuestas a reseñas | F4 | NUNCA auto-publish. IA propone, humano aprueba. |
| Landings multi-dominio | F4 | 3 modos: `/r/[slug]` (default), `[brand].migraflix.com` (wildcard), dominio propio (CNAME). |
| Idioma | Todas | Español LATAM. Sin voseo en .tsx/.md. |

---

## Resumen Ejecutivo de Features

| # | Feature | Estimado dev | Prioridad | Depende de |
|---|---------|--------------|-----------|------------|
| F1 | Login IG + Multi-tenant + Publicación (feed/Stories/Reels + agendar) | _____ | P0 | — |
| F2 | Bots IA WhatsApp + Voz | _____ | P1 | F1 |
| F3 | Sentry: auditoría + triage + Linear | _____ | P2 (quick-win) | — |
| F4 | SEO automatizado: landings multi-dominio + GMB + directorios | _____ | P1 | F1 |
| **Total** | | _____ | | |

**Orden recomendado:** F3 → F1 → F4 → F2.

---

# F1 — Login IG + Multi-tenant + Publicación (Feed/Stories/Reels + Agendar)

**Estimado dev (total):** _____

## 1. Contexto

Hoy Migraflix es admin-only. Los restaurantes (Brands en Airtable) no tienen cuenta propia y la publicación a Instagram es manual o vía n8n.

**Necesitamos** que cada restaurante entre con su propia cuenta de Instagram, vea solo su Brand, y pueda publicar contenido (feed, Stories, Reels) ahora o agendado con un clic.

## 2. Diseño técnico

### Flow OAuth
```
[Restaurante en /dashboard/login]
   → click "Entrar con Instagram"
[/api/auth/instagram] → redirect a Meta OAuth
   → usuario autoriza
[/api/auth/instagram/callback]
   → exchange code → short-lived token → long-lived token (60d)
   → GET /me?fields=username,account_type
   → detectar Business vs Personal
   → normalizar username
   → findBrandByInstagramId() o findBrandByHandle()
   ├ match → guardar token, set cookie restaurant_token, redirect /dashboard
   └ no match → redirect /dashboard/vincular
```

### Schema Airtable — campos nuevos en `Brands`

| Campo | Tipo | Notas |
|-------|------|-------|
| `instagram_user_id` | Text | ID numérico de IG |
| `instagram_username` | Text | Handle sin @ |
| `ig_access_token_encrypted` | Long text | AES-256-GCM |
| `ig_token_expires_at` | DateTime | 60 días desde emisión |
| `can_publish` | Checkbox | True solo si Business |
| `last_login_at` | DateTime | Última entrada del brand |

### Schema Airtable — nueva tabla `ScheduledPosts`

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
| `ig_media_id` | Text | ID que devuelve IG |
| `error_message` | Long text | Si falló |

### Endpoints de publicación

| Tipo | Flow IG Graph API |
|------|-------------------|
| Feed | `POST /{ig_user_id}/media` (image_url) → `/media_publish` |
| Story | `POST /{ig_user_id}/media` (image_url, `media_type=STORIES`) → publish |
| Reel | `POST /{ig_user_id}/media` (video_url, `media_type=REELS`, `cover_url`) → poll status → publish |

### Files a modificar
- `lib/auth.ts` (37 líneas) — agregar `signRestaurantToken`, `verifyRestaurantToken`, `getRestaurantSession`.
- `middleware.ts` (34 líneas) — extender matcher con `/dashboard/:path*`.
- `lib/airtable/brands.ts` (239 líneas) — agregar `findBrandByInstagramId`, `findBrandByHandle`, `linkInstagramToBrand`.

### Files nuevos
- `lib/instagram/oauth.ts`, `publish.ts`, `scheduler.ts`, `token-refresh.ts`
- `lib/crypto/token-cipher.ts`
- `app/api/auth/instagram/route.ts` + `callback/route.ts`
- `app/api/restaurant/instagram/publish/route.ts` + `schedule/route.ts`
- `app/api/cron/publish-scheduled/route.ts` (cada 5 min)
- `app/api/cron/refresh-ig-tokens/route.ts` (diario)
- `app/dashboard/{page,login,vincular,publicar,agendados,logout}.tsx`

## 3. Tareas granulares — F1

| # | Tarea | Estimado dev | Notas dev |
|---|-------|-------------:|-----------|
| 1 | Setup App Meta + revisar permisos requeridos (incluye Stories/Reels) | | |
| 2 | Flow OAuth `/api/auth/instagram` + callback + cookie | | |
| 3 | Detección Business vs Personal + flag `can_publish` | | |
| 4 | Schema Airtable: 6 campos en `Brands` + tabla `ScheduledPosts` | | |
| 5 | Encriptación AES-256-GCM de tokens | | |
| 6 | `findBrandByInstagramId` + `findBrandByHandle` + match | | |
| 7 | Pantalla `/dashboard/login` | | |
| 8 | Pantalla `/dashboard/vincular` | | |
| 9 | Middleware multi-tenant: `restaurant_token` + `/dashboard/*` | | |
| 10 | Refactor APIs existentes para filtrar por `brandId` | | |
| 11 | Dashboard home `/dashboard` (lista contenido del brand) | | |
| 12 | Endpoint publicación **feed** + UI | | |
| 13 | Endpoint publicación **Story** (24h, sticker/link opcional) | | |
| 14 | Endpoint publicación **Reel** (video + cover + poll status) | | |
| 15 | UI `/dashboard/publicar` con selector de tipo + estados | | |
| 16 | Agendamiento: cron `/api/cron/publish-scheduled` + retries | | |
| 17 | UI `/dashboard/agendados` (lista + editar + cancelar) | | |
| 18 | Cron diario refresh long-lived token + alerta si falla | | |
| 19 | Logout + invalidación cookie | | |
| 20 | Tests E2E con cuenta de prueba (los 3 tipos + agendado) | | |
| 21 | Docs internas onboarding de Brand nuevo | | |
| 22 | App Review de Meta (someter + iteraciones — variable) | | |
| | **Total F1** | _____ | |

## 4. Riesgos F1

- **Meta App Review** tarda 2–6 semanas (no contado en horas dev). Empezar el trámite el día 1.
- **Tokens 60d expiran silenciosamente** si el cron falla → restaurante pierde acceso. Mitigación: alerta admin si refresh falla 2 veces.
- **Handle de Airtable** no siempre coincide con username real de IG. Necesita normalización robusta.
- **Reels processing async:** IG tarda 30s-5min en procesar video. Cron debe poll status antes de "publish" final.

## 5. Supuestos del dev (llenar)

- _____________________________________________
- _____________________________________________
- _____________________________________________

\newpage

# F2 — Bots IA por Restaurante (WhatsApp + Voz)

**Estimado dev (total):** _____

## 1. Contexto

Hoy Chefiando atiende consultas de clientes finales (comensales) manualmente desde el WhatsApp del restaurante. No hay automatización de voz. Pierde consultas fuera de horario y no mide CSAT.

**Objetivo:** cada restaurante tiene un bot 24/7 que responde menú, horarios, ubicación, reservas básicas (WhatsApp texto) y opcionalmente atiende llamadas con un bot de voz que toma pedido/reserva y escala a humano cuando hace falta.

## 2. Diseño técnico

### Stack (decidido)
- **WhatsApp:** SendPulse (ya pago + integrado). Evaluar wacrm como benchmark en POC inicial.
- **LLM:** Claude Haiku 4.5.
- **Voz:** nlpearl.
- **Knowledge base:** Airtable per-brand (sin vector store en MVP).

### Schema Airtable

**`BotConfigs`** (1 row por brand):
- `brandId`, `whatsapp_enabled`, `voice_enabled`, `whatsapp_number`, `voice_number`
- `bot_persona` (system prompt), `menu_json`, `horarios`, `direccion`, `faqs_json`
- `handoff_keywords` (multi-select), `handoff_notify_phone`

**`Conversations`** (1 row por conversación — patrón anti-bloat):
- `brandId`, `channel`, `customer_id`, `messages_json` (long text), `messages_count`
- `tokens_used`, `cost_estimated_usd`, `duration_seconds`
- `created_at`, `last_message_at`, `closed_at`, `status`, `csat_rating`

**`Conversations_Archive`** — mismo schema, recibe rows >90 días via job mensual.

### Files nuevos
- `lib/bots/{whatsapp,voice,prompt-builder,llm,conversation-logger,airtable-throttle,handoff}.ts`
- `app/api/bots/{whatsapp,voice}/webhook/route.ts`
- `app/api/cron/archive-conversations/route.ts` (mensual)
- `app/dashboard/bot/{page,conversaciones}.tsx`

## 3. Tareas granulares — F2

| # | Tarea | Estimado dev | Notas dev |
|---|-------|-------------:|-----------|
| 1 | Comparativa SendPulse vs wacrm (POC corto) | | |
| 2 | Setup webhooks WhatsApp en proveedor elegido | | |
| 3 | Schema `BotConfigs` + `Conversations` + `Conversations_Archive` | | |
| 4 | UI `/dashboard/bot` (config: menú, horarios, FAQs, persona) | | |
| 5 | Prompt builder dinámico por brand | | |
| 6 | Wrapper Anthropic + manejo errores + retries | | |
| 7 | Webhook entrada WhatsApp → procesar → responder | | |
| 8 | Logger conversaciones + medición tokens/costo | | |
| 9 | Handoff a humano (detección keywords + notif) | | |
| 10 | UI historial conversaciones (búsqueda + filtros) | | |
| 11 | Setup nlpearl + número asignado | | |
| 12 | Webhook voz → reservas/pedidos | | |
| 13 | Transcripción + log de llamadas | | |
| 14 | Tests con cuentas reales (1 brand piloto) | | |
| 15 | Onboarding: cómo conectar WhatsApp del restaurante | | |
| 16 | Rate limiting + protección abuso por brand | | |
| 17 | Docs cliente: cómo entrenar al bot | | |
| 18 | Throttling escrituras Airtable (queue + retry) | | |
| 19 | Job mensual archivado a `Conversations_Archive` | | |
| | **Total F2** | _____ | |

## 4. Riesgos F2

- Calidad del bot = calidad del prompt + datos del brand. Mitigación: UI guiada + piloto.
- Costos variables sin control (Chefiando absorbe). Monitorear gasto mensual.
- Volumen Airtable: con 50 brands x 200 conversaciones/mes = 10k rows. Archivado mantiene activa <30k.

## 5. Supuestos del dev (llenar)

- _____________________________________________
- _____________________________________________
- _____________________________________________

\newpage

# F3 — Auditoría Sentry + Triage + Linear

**Estimado dev (total):** _____

## 1. Contexto

Sentry ya está instalado (`sentry.client.config.ts:1-78`) pero:
- No hay certeza que el DSN esté seteado en Vercel producción.
- 9+ docs en `/docs/` sobre Sentry — señal de que la config fue dolorosa y no quedó cerrada.
- No hay alertas, no hay runbook, no hay integración con Linear.

**Objetivo:** dejar Sentry en estado "Listo" — auditoría + triage + alertas + loop Sentry↔Linear.

## 2. Diseño técnico

**Fase 1 — Auditoría:** validar DSN en Vercel, source maps, sampling, ignoreErrors.

**Fase 2 — Triage:** API Sentry → lista de errores activos → reporte priorizado en `docs/sentry-triage-2026-05.md`.

**Fase 3 — Alertas:** 3 mínimo (nuevo error / spike / crítico) hacia Slack o email.

**Fase 4 — Integración Linear:**

```
[Sentry detecta issue] → webhook → /api/integrations/sentry-to-linear
   → Linear API: create issue
   → Mapping guardado en Airtable

[Linear issue Done] → webhook → /api/integrations/linear-to-sentry
   → Sentry API: resolve
```

### Files nuevos
- `lib/integrations/sentry.ts`, `linear.ts`
- `app/api/integrations/{sentry-to-linear,linear-to-sentry}/route.ts`
- `docs/sentry-runbook.md`, `docs/sentry-triage-2026-05.md`

## 3. Tareas granulares — F3

| # | Tarea | Estimado dev | Notas dev |
|---|-------|-------------:|-----------|
| 1 | Verificar DSN en Vercel (prod + preview) | | |
| 2 | Validar envío desde client/server/edge con test errors | | |
| 3 | Configurar Source Maps upload en build | | |
| 4 | Revisar y ajustar `ignoreErrors` (`sentry.client.config.ts:49-63`) | | |
| 5 | Configurar releases (asociar deploys a versiones) | | |
| 6 | Triage errores actuales + reporte priorizado | | |
| 7 | Configurar 3 alertas (Slack o email) | | |
| 8 | Endpoint webhook `sentry-to-linear` | | |
| 9 | Cliente Linear con templates de issue | | |
| 10 | Webhook reverso Linear → resolve Sentry | | |
| 11 | Vistas custom Sentry (por tipo de error) | | |
| 12 | Runbook top-5 errores comunes | | |
| 13 | Testing loop completo Sentry→Linear→fix→cierre | | |
| | **Total F3** | _____ | |

## 4. Riesgos F3

- Webhook loop si Linear resuelve y Sentry re-abre por nuevo evento. Mitigación: ignorar reaperturas <30 días.
- Spam de issues Linear si Sentry crea uno por cada error nuevo. Mitigación: crear issue solo si level >= warning Y users_affected >= 2.

## 5. Supuestos del dev (llenar)

- _____________________________________________
- _____________________________________________

\newpage

# F4 — SEO Automatizado: Landings Multi-Dominio + GMB + Directorios

**Estimado dev (total):** _____

## 1. Contexto

Los restaurantes hoy:
- No tienen landing pública optimizada → invisibles en búsqueda local.
- GMB semi-abandonado: horarios desactualizados, sin posts, sin respuesta a reseñas.
- Ausentes en directorios LATAM relevantes.

**Objetivo:** automatizar presencia SEO/SEM local con 3 sub-sistemas (A, B, C) + trackeo unificado (D).

## 2. Diseño técnico

### A) Landings públicas multi-dominio

**3 modos de URL, resolución por host:**

```
[Request entra con host X]
   → middleware
   → si X = migraflix.com → URL /r/[slug]
   → si X = *.migraflix.com → match Brand.subdomain → rewrite a /r/[slug]
   → si X es dominio custom → lookup BrandDomains → rewrite a /r/[slug]
```

**Schema Airtable — campos nuevos en `Brands`:** `slug`, `subdomain`, `subdomain_enabled`.

**Schema Airtable — nueva tabla `BrandDomains`:** `brandId`, `custom_domain`, `status`, `verification_token`, `ssl_status`, `connected_at`, `vercel_project_alias`.

**Flow conexión dominio custom:**
1. Brand ingresa dominio en `/dashboard/seo/dominio`.
2. Sistema genera `verification_token`.
3. Instrucciones DNS: TXT + CNAME.
4. Brand confirma → cron `verify-domains` (cada 10 min) chequea TXT.
5. Vercel API agrega alias → SSL automático.
6. Estado: `verified`.

**Wildcard DNS:** `*.migraflix.com` → CNAME a Vercel + wildcard domain en proyecto Vercel.

### B) Google My Business

- **OAuth Google** (scope `business.manage`) → tokens encriptados en `Brands` (campos `gmb_*`).
- **Sync diferencial:** cron diario lee `Brands`, compara con GMB, PATCH si difiere.
- **Posts:** UI `/dashboard/seo/gmb/posts/nuevo` → IA genera 3 variantes → brand elige → publica. Rate limit max 1/día, 3/semana.
- **Reseñas:** **NUNCA auto-publish**. Cron pull reseñas → IA propone respuesta → UI aprueba/edita/publica.
- **Métricas:** cron diario pull `insights` API → tabla `GmbMetrics`.

### C) Directorios externos

- Shortlist 10 LATAM: TripAdvisor, OpenTable, PedidosYa, Rappi, Restorando, Cuponatic, Listado, Yelp, Foursquare, Zomato.
- Implementación realista: 4-5 con API + 2-3 con autofill semi-asistido.
- **No scraping** (viola TOS, riesgo de baneo del brand).
- Tabla `BrandListings` + cola de sync semanal.

### D) Trackeo de conversiones

- Tabla `SeoEvents` (1 row por brand-día, agregado).
- Endpoint `/api/seo/event` (POST).
- Reporte unificado en `/dashboard/seo` con desglose por canal + dominio.

## 3. Tareas granulares — F4

### A — Landings públicas + Multi-dominio

| # | Tarea | Estimado dev | Notas dev |
|---|-------|-------------:|-----------|
| 1 | Diseño UI landing pública (mockup + aprobación) | | |
| 2 | `app/r/[slug]/page.tsx` con SSG + ISR | | |
| 3 | Schema.org Restaurant + JSON-LD + OpenGraph dinámico | | |
| 4 | Sitemap dinámico (root + por host) + robots.txt | | |
| 5 | Form de reserva → WhatsApp del brand | | |
| 6 | Trackeo eventos en `SeoEvents` (agregado por brand-día) | | |
| 7 | `/dashboard/seo` overview (conversiones, ranking, impresiones) | | |
| 7b | Setup wildcard DNS `*.migraflix.com` en Cloudflare/Vercel | | |
| 7c | Middleware host routing (host → brandId con rewrite interno) | | |
| 7d | UI `/dashboard/seo/dominio` (slug + subdominio + conectar dominio propio) | | |
| 7e | Schema `BrandDomains` + campos `slug`/`subdomain` en Brands | | |
| 7f | Endpoints connect/verify/disconnect + cron `verify-domains` | | |
| 7g | Integración Vercel API (alias add/remove + monitor SSL) | | |
| 7h | Branding condicional (oculta "Powered by" en dominio propio) | | |

### B — Google My Business

| # | Tarea | Estimado dev | Notas dev |
|---|-------|-------------:|-----------|
| 8 | Setup Google Cloud + GMB API + verificación de proyecto | | |
| 9 | OAuth Google + scope GMB + storage tokens encriptados | | |
| 10 | UI `/dashboard/seo/gmb` (conectar + estado) | | |
| 11 | Sync horarios/fotos/menú Airtable → GMB | | |
| 12 | Publicación posts GMB (texto + imagen) | | |
| 13 | IA: generar copy (3 variantes) desde brief del brand | | |
| 14 | Pull reseñas → tabla `Reviews` | | |
| 15 | IA: propuesta de respuesta con tono del brand | | |
| 16 | UI `/dashboard/seo/reviews` aprobar/editar/publicar | | |
| 17 | Pull métricas GMB → tabla `GmbMetrics` | | |
| 18 | Cron diario sync + métricas + reviews | | |

### C — Directorios externos (5-10)

| # | Tarea | Estimado dev | Notas dev |
|---|-------|-------------:|-----------|
| 19 | Investigación API de 10 directorios LATAM | | |
| 20 | Schema `BrandListings` + cola de sync | | |
| 21 | UI `/dashboard/seo/listings` (estado por directorio) | | |
| 22 | Integración API TripAdvisor (si aplica) | | |
| 23 | Integración API OpenTable | | |
| 24 | Integración API PedidosYa o Rappi | | |
| 25 | 2 directorios más con API o autofill semi-asistido | | |
| 26 | Cron semanal de sync diferencial | | |

### D — Cross-cutting

| # | Tarea | Estimado dev | Notas dev |
|---|-------|-------------:|-----------|
| 27 | Tests E2E (landing + GMB sandbox + 1 directorio) | | |
| 28 | Docs cliente: cómo aprovechar SEO | | |
| | **Total F4** | _____ | |

## 4. Riesgos F4

1. **Penalización GMB por spam** — rate limit + variación IA + max 1 post/día.
2. **Directorios sin API** — solo APIs oficiales + autofill semi-asistido. Nunca scraping.
3. **Reseñas mal respondidas** — aprobación humana obligatoria.
4. **Listings duplicados** — reclamar antes (manual, parte del onboarding).
5. **Dominio propio mal configurado** — UI clara + retry + soporte humano para primer dominio.
6. **Límite aliases Vercel** — Pro = 50. Si se vende a >50 brands con dominio propio, upgrade.
7. **SSL provisioning** — Vercel a veces tarda. Cron re-intenta y alerta si >24h.

## 5. Supuestos del dev (llenar)

- _____________________________________________
- _____________________________________________
- _____________________________________________

\newpage

# Riesgos globales y dependencias

## Grafo de dependencias

```
F3 (Sentry) — independiente, arrancar primera semana
   ↓
F1 (Login IG + Multi-tenant) — FUNDACIÓN, todo lo demás depende
   ├──→ F4 (SEO + GMB + Landings) — usa sesión de restaurante
   └──→ F2 (Bots IA) — usa sesión y costos absorbidos por Chefiando
```

## Riesgos globales

1. **Meta App Review (F1):** 2-6 semanas de bloqueador externo. **Empezar trámite el día 1 del proyecto.**
2. **Costos variables sin cobro (F2 + F4):** Chefiando absorbe LLM + voz + WhatsApp + GMB. Definir umbral mensual y revisar mensualmente.
3. **Airtable como DB de tablas que crecen:** `Conversations` (F2) y `SeoEvents` (F4). Trigger de migración: >30k rows/mes O >1.500 brands → cotizar migración Supabase aparte.
4. **Vercel Pro necesario:** F4 requiere wildcard domains + custom domains. Hobby plan no soporta. Confirmar plan antes de empezar.
5. **Calidad de prompts/IA (F2, F4):** dependen de datos del brand. UI guiada + piloto antes de rollout masivo.

\newpage

# Totales

| Feature | Estimado dev | Comentario dev |
|---------|-------------:|----------------|
| F1 Login IG + Publicación | _____ | |
| F1 — App Review Meta extra | _____ | |
| F2 Bots IA | _____ | |
| F3 Sentry | _____ | |
| F4 SEO + GMB + Directorios | _____ | |
| **Buffer por imprevistos (sugerido 15%)** | _____ | |
| **TOTAL FINAL** | _____ | |

## Tarifa y plazo

- **Tarifa por hora del dev:** USD _________ / hora
- **Total estimado en USD:** USD _________
- **Plazo de entrega total estimado:** _________ semanas
- **Disponibilidad horas/semana:** _____ h/semana
- **Fecha de inicio propuesta:** _________
- **Modalidad de pago propuesta:** _______________________________________________

## Condiciones del dev

- _______________________________________________
- _______________________________________________
- _______________________________________________

\newpage

# Firma

Confirmo que revisé las 4 features de este documento, llené las estimaciones de horas por tarea, y mis números reflejan un trabajo realista que puedo entregar en el plazo indicado.

| | |
|---|---|
| **Nombre del dev:** | _______________________________________________ |
| **Email:** | _______________________________________________ |
| **Fecha:** | _______________________________________________ |
| **Firma:** | _______________________________________________ |

---

**Documento generado por GNB Labs.** Para dudas: soy@gabrielneuman.com.
