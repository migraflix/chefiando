---
titulo: "SEO Automatizado: Landings Multi-Dominio + Google My Business + Directorios"
fecha: 2026-05-22
proyecto: chefiando
estado: draft
tipo: PRD
tags: [seo, gmb, google-business, listings, schema-org, sitemap, directorios, multi-dominio, subdominios, custom-domain]
feature: F4
prioridad: P1
horas_estimadas: 170-225h
depende_de: [F1]
---

# F4 — SEO Automatizado: Landings Multi-Dominio + GMB + Directorios

> Sub-PRD del plan maestro. Reemplaza al "Dashboard de métricas" previo.
> **v2 — 2026-05-22:** las landings ahora soportan 3 modos de URL: slug (`/r/[brand]`), subdominio wildcard (`[brand].migraflix.com`) y dominio propio del brand (CNAME). Esto habilita revender el sistema de landings como producto independiente.

## 1. Contexto

Los restaurantes de Chefiando hoy:
- No tienen landing pública optimizada → invisibles en búsqueda local.
- Su GMB está semi-abandonado: horarios desactualizados, sin posts, sin respuesta a reseñas.
- No están en directorios LATAM relevantes (TripAdvisor, OpenTable, PedidosYa, Restorando, etc.) o tienen fichas duplicadas/abandonadas.

**Resultado:** dependen 100% de Instagram para descubrimiento. Pierden tráfico orgánico de Google y conversiones (llamadas, "cómo llegar", reservas).

**Objetivo:** automatizar presencia SEO/SEM local: landing pública por restaurante + sincronización GMB + presencia en 5–10 directorios.

## 2. Outcome y MAA

- **Medir:** **conversiones desde SEO** = (clics en "llamar" + clics en "cómo llegar" + submits de form de reserva). Reportadas en `/dashboard/seo` con desglose por canal (landing, GMB, directorios).
- **Analizar:** baseline = 0 hoy (no se mide). Comparar mensual. Target trimestre 1: ≥20 conversiones/mes por brand activo en SEO.
- **Actuar:** si un brand tiene <5 conversiones/mes después de 60 días → revisar ficha, fotos, horarios. Revisar tendencias en `/cierre-semana`.

## 3. Scope

**In-scope:**
- **A) Landings públicas multi-dominio** — el mismo contenido se sirve por 3 rutas, configurable por brand:
  - **A1) Slug** en plataforma: `migraflix.com/r/[brand-slug]` (default, gratis, siempre activo).
  - **A2) Subdominio wildcard:** `[brand-slug].migraflix.com` (opt-in, DNS wildcard ya configurado).
  - **A3) Dominio propio del brand:** `chefcito.com` vía CNAME a Vercel (opt-in, brand maneja DNS).
  - Match por host en middleware: misma página, distintos hosts → resuelve a mismo Brand.
- **B) GMB completo:** OAuth, sync info, publicar posts, IA propone respuestas a reseñas (aprobación humana), pull métricas.
- **C) Directorios externos:** 5-10 directorios LATAM con API oficial donde existe + autofill semi-asistido donde no.
- **D) Trackeo de conversiones** unificado para reporte MAA, agnóstico al dominio (rastrea por brandId).
- **E) Producto revendible:** la lógica multi-dominio queda diseñada para que en el futuro pueda venderse a clientes no-restaurante (otros verticales) como sistema de landings con dominio propio.

**Out-of-scope:**
- SEO técnico para palabras clave fuera del nombre del brand (no estrategia de keywords).
- Anuncios pagados (Google Ads, Meta Ads).
- Scraping de directorios sin API (viola TOS, riesgo de baneo).
- Editor visual de landing (template fijo configurable por datos de Airtable, no drag-and-drop).
- Multi-página por brand (solo 1 landing por brand en esta fase).

## 4. Decisiones de diseño

| Decisión | Elección | Razón |
|----------|----------|-------|
| Landings | En Migraflix `/r/[slug]` con SSG + ISR | Control total + SEO controlado |
| Respuestas a reseñas | **NUNCA auto-publish** — IA propone, humano aprueba | Riesgo reputacional alto |
| Directorios sin API | Autofill semi-asistido (humano da clic final) | TOS y reputación |
| Rate limit posts GMB | Max 1 post/día/brand, max 3/semana | Evitar penalización por spam |
| Variación de copy | IA genera 3 variantes por post para evitar duplicado | Anti-penalización |

## 5. Diseño técnico

### A) Landings públicas multi-dominio

**Resolución por host:** middleware lee el header `host` de cada request y resuelve a un brand:

```
[Request entra con host = "X"]
   ↓ middleware.ts
   ↓ ¿X es migraflix.com?
   │     → URL /r/[slug] → render landing del brand con ese slug
   ↓ ¿X es *.migraflix.com (subdominio)?
   │     → extract subdomain → match con Brand.subdomain → render landing
   ↓ ¿X es un dominio custom?
   │     → lookup BrandDomains where custom_domain = X → match brandId → render landing
   ↓ fallback 404
```

**Una sola página** `app/r/[slug]/page.tsx` se reutiliza para los 3 casos. En subdominio y dominio custom, el middleware hace rewrite interno a `/r/[slug]` para mantener un solo componente.

**Schema Airtable — campos nuevos en `Brands`:**

| Campo | Tipo | Notas |
|-------|------|-------|
| `slug` | Text (unique) | Slug en `/r/[slug]`. Auto-generado del `Negocio` al crear, editable. |
| `subdomain` | Text (unique, nullable) | `[brand].migraflix.com`. Vacío = no usa subdominio. |
| `subdomain_enabled` | Checkbox | Activado por el brand desde dashboard. |

**Schema Airtable — nueva tabla `BrandDomains`** (para custom domains):

| Campo | Tipo | Notas |
|-------|------|-------|
| `brandId` | Link | A Brands |
| `custom_domain` | Text (unique) | Ej `chefcito.com` o `www.chefcito.com` |
| `status` | Select | pending_dns / verifying / verified / failed |
| `verification_token` | Text | Para validar ownership vía TXT record |
| `ssl_status` | Select | provisioning / active / failed |
| `connected_at` | DateTime | Cuando se verificó |
| `vercel_project_alias` | Text | ID de alias en Vercel (para borrar luego si se desconecta) |

**Flow conexión de dominio custom:**

```
Brand entra a /dashboard/seo/dominio
   ↓ ingresa "chefcito.com"
   ↓ sistema genera verification_token
   ↓ instrucciones DNS al brand:
      - TXT migraflix-verify.chefcito.com = <token>
      - CNAME @ → cname.vercel-dns.com
   ↓ brand confirma "ya configuré DNS"
   ↓ /api/cron/verify-domains corre cada 10 min
   ↓ ¿TXT está? → status=verifying
   ↓ POST a Vercel API: agregar alias chefcito.com al proyecto
   ↓ Vercel emite SSL automático → ssl_status=active
   ↓ status=verified → landing accesible
```

**Wildcard DNS:**
- En el DNS de migraflix.com configurar `*.migraflix.com` → CNAME a Vercel.
- En Vercel, agregar wildcard domain `*.migraflix.com` al proyecto.
- SSL wildcard provisionado por Vercel automático.

**Página `/r/[slug]/page.tsx`** (reutilizada por los 3 modos):
- `generateStaticParams`: itera Brands de Airtable.
- `revalidate: 3600` (ISR cada hora).
- Renderiza:
  - Hero (foto + nombre + ciudad)
  - Historia del emprendedor
  - Menú (cards desde menu_json)
  - Horarios
  - Mapa embed + dirección
  - Reseñas Google embed (top 3)
  - CTA WhatsApp + form de reserva
  - Schema.org Restaurant JSON-LD
  - Branding: si está en dominio custom, oculta footer "Powered by Migraflix" (o lo deja según tier).

**Sitemap dinámico:**
- `/sitemap.xml` en `migraflix.com` lista TODOS los `/r/[slug]`.
- `/sitemap.xml` por subdominio o dominio custom lista SOLO la landing de ese brand + sub-secciones futuras.

**Schema.org Restaurant** mínimo: `name`, `address`, `geo`, `telephone`, `openingHours`, `priceRange`, `servesCuisine`, `image`, `aggregateRating` (si hay reseñas), `sameAs` (links IG + GMB).

### B) Google My Business

**OAuth Google** (scope `business.manage`) → guardar tokens encriptados en Airtable `Brands` (campos nuevos):
- `gmb_account_id`, `gmb_location_id`, `gmb_access_token_encrypted`, `gmb_refresh_token_encrypted`, `gmb_connected_at`.

**Sync diferencial:** cron diario lee `Brands` → compara `horarios`/`direccion`/fotos con GMB → PATCH si difiere. Solo lo que cambió.

**Publicación de posts:**
- UI `/dashboard/seo/gmb/posts/nuevo` con tipos: oferta, evento, novedad.
- IA genera 3 variantes de copy → restaurante elige → publica via GMB API.
- Rate limit: chequear última publicación del brand antes de permitir.

**Reseñas con aprobación humana:**
- Cron diario pull reseñas nuevas → tabla `Reviews` con `status=pending_response`.
- Para cada review nueva con rating <=3 o que pida respuesta: IA genera propuesta de respuesta usando tono del brand (`bot_persona` de F2 si existe, sino default amable).
- UI `/dashboard/seo/reviews`: feed con cada reseña + respuesta IA editable + botón "Aprobar y publicar" / "Descartar".
- NUNCA auto-publica.

**Métricas GMB:** cron diario pull `insights` API → tabla `GmbMetrics` (brandId, date, views_search, views_maps, calls, direction_requests, website_clicks).

### C) Directorios externos

**Investigación previa** (tarea #19): por cada directorio del shortlist, determinar:
- ¿Tiene API oficial?
- ¿Permite registro programático o solo manual?
- ¿Costo de listing?
- ¿TOS permite uso automatizado?

Shortlist sugerida (10): TripAdvisor, OpenTable, PedidosYa, Rappi, Restorando, Cuponatic, Listado.com, Yelp, Foursquare, Zomato (donde aplique por país).

**Implementación realista:** 4-5 con API + 2-3 con autofill semi-asistido. Resto = backlog.

**Schema Airtable `BrandListings`:**
- `brandId`, `directory_name` (Select), `external_url`, `external_id`, `status` (Select: pending/published/error/manual_required), `last_synced_at`, `last_error`.

**Cola de sync** (`lib/listings/sync-queue.ts`):
- Cuando brand cambia horarios/dirección/fotos → encolar updates a cada directorio con API.
- Procesar en cron semanal, no más de 1 update por directorio por brand por día.

### D) Trackeo de conversiones

Tabla `SeoEvents`: `brandId`, `event_type` (call/directions/reservation_form/landing_view), `source` (landing/gmb/directory:tripadvisor/etc), `timestamp`, `metadata_json`.

Endpoints `/api/seo/event` (POST) registra eventos. Cards en landing usan `<a>` con `data-track` que dispara fetch al endpoint.

GMB metrics ya vienen agregadas, se mergean con `SeoEvents` en `/dashboard/seo` para reporte unificado.

### Files nuevos

**Landings + Multi-dominio:**
- `app/r/[slug]/page.tsx`
- `app/r/[slug]/opengraph-image.tsx` (dinámica)
- `app/sitemap.ts` (root)
- `app/[subdomain]/sitemap.ts` (por host) o lógica en root que detecta host
- `app/robots.ts`
- `lib/seo/landing-builder.ts`
- `lib/seo/schema-org.ts`
- `lib/domains/resolver.ts` (host → brandId)
- `lib/domains/vercel-api.ts` (CRUD aliases en Vercel)
- `lib/domains/dns-verifier.ts` (chequear TXT)
- `app/api/seo/event/route.ts`
- `app/api/domains/connect/route.ts` (brand inicia conexión de dominio)
- `app/api/domains/verify/route.ts` (force-check)
- `app/api/domains/disconnect/route.ts`
- `app/api/cron/verify-domains/route.ts` (cada 10 min)
- `app/dashboard/seo/dominio/page.tsx` (UI conectar/desconectar/estado)
- Modificación de `middleware.ts` — agregar host routing antes de auth.

**GMB:**
- `lib/gmb/oauth.ts`
- `lib/gmb/posts.ts`
- `lib/gmb/sync.ts`
- `lib/gmb/reviews.ts`
- `lib/gmb/metrics.ts`
- `lib/gmb/ai-response.ts`
- `app/api/auth/google/route.ts`
- `app/api/auth/google/callback/route.ts`
- `app/api/cron/gmb-sync/route.ts`
- `app/api/cron/gmb-metrics-pull/route.ts`
- `app/api/cron/gmb-reviews-pull/route.ts`
- `app/dashboard/seo/page.tsx`
- `app/dashboard/seo/gmb/page.tsx`
- `app/dashboard/seo/reviews/page.tsx`

**Directorios:**
- `lib/listings/sync-queue.ts`
- `lib/listings/tripadvisor.ts`
- `lib/listings/opentable.ts`
- `lib/listings/pedidos-ya.ts`
- `lib/listings/...` (uno por directorio integrado)
- `app/api/cron/listings-sync/route.ts`
- `app/dashboard/seo/listings/page.tsx`

## 6. Tareas granulares

### A — Landings públicas + Multi-dominio

| # | Tarea | Horas |
|---|-------|-------|
| 1 | Diseño UI landing pública (mockup + aprobación) | 6 |
| 2 | `app/r/[slug]/page.tsx` con SSG + ISR | 8 |
| 3 | Schema.org Restaurant + JSON-LD + OpenGraph dinámico | 4 |
| 4 | Sitemap dinámico (root + por host) + robots.txt | 4 |
| 5 | Form de reserva → WhatsApp del brand | 5 |
| 6 | Trackeo de eventos en `SeoEvents` (agregado por brand-día) | 5 |
| 7 | `/dashboard/seo` overview (conversiones, ranking, impresiones) | 8 |
| 7b | Setup wildcard DNS `*.migraflix.com` en Cloudflare/Vercel | 3 |
| 7c | Middleware host routing (resolve host → brandId con rewrite interno) | 6 |
| 7d | UI `/dashboard/seo/dominio` (slug + subdominio + conectar dominio propio) | 8 |
| 7e | Schema `BrandDomains` + campos `slug`/`subdomain` en Brands | 4 |
| 7f | Endpoints connect/verify/disconnect + cron `verify-domains` | 6 |
| 7g | Integración Vercel API (alias add/remove + monitor SSL) | 6 |
| 7h | Branding condicional (oculta "Powered by" en dominio propio) | 2 |

### B — Google My Business

| # | Tarea | Horas |
|---|-------|-------|
| 8 | Setup Google Cloud + GMB API + verificación de proyecto | 4 |
| 9 | OAuth Google + scope GMB + storage tokens encriptados | 8 |
| 10 | UI `/dashboard/seo/gmb` (conectar + estado) | 6 |
| 11 | Sync horarios/fotos/menú Airtable → GMB | 10 |
| 12 | Publicación posts GMB (texto + imagen) | 6 |
| 13 | IA: generar copy (3 variantes) desde brief del brand | 5 |
| 14 | Pull reseñas → tabla `Reviews` | 5 |
| 15 | IA: propuesta de respuesta con tono del brand | 5 |
| 16 | UI `/dashboard/seo/reviews` aprobar/editar/publicar | 8 |
| 17 | Pull métricas GMB → tabla `GmbMetrics` | 5 |
| 18 | Cron diario sync + métricas + reviews | 4 |

### C — Directorios externos

| # | Tarea | Horas |
|---|-------|-------|
| 19 | Investigación API de 10 directorios LATAM | 8 |
| 20 | Schema `BrandListings` + cola de sync | 5 |
| 21 | UI `/dashboard/seo/listings` (estado por directorio) | 6 |
| 22 | Integración API TripAdvisor (si aplica) | 8 |
| 23 | Integración API OpenTable | 8 |
| 24 | Integración API PedidosYa o Rappi | 8 |
| 25 | 2 directorios más con API o autofill semi-asistido | 12 |
| 26 | Cron semanal de sync diferencial | 4 |

### D — Cross-cutting

| # | Tarea | Horas |
|---|-------|-------|
| 27 | Tests E2E (landing + GMB sandbox + 1 directorio) | 10 |
| 28 | Docs cliente: cómo aprovechar SEO | 4 |

| **Total** | **221h** |
|-----------|----------|
| **Rango con buffers** | **170–225h** |

## 7. Supuestos y riesgos

**Supuestos:**
- Google aprueba la app GMB (menos estricto que Meta).
- Cliente acepta política: respuestas a reseñas siempre con aprobación humana.
- Al menos 4 de los 10 directorios investigados tienen API oficial.
- Brands actuales o pueden reclamar sus fichas en directorios (parte del onboarding).
- Vercel plan Pro disponible para wildcard domains + custom domains ilimitados (Hobby no soporta wildcard).
- Brand que pide dominio propio sabe configurar DNS o tiene quien lo haga.

**Riesgos:**
1. **Penalización GMB por spam** — Google detecta posteo automatizado masivo. Mitigación: rate limit + variación IA + posts marcados como "Auto-generated by Migraflix" en metadata.
2. **Directorios sin API** — scraping viola TOS y puede banear la cuenta del restaurante. Por eso solo APIs oficiales + autofill semi-asistido.
3. **Reseñas mal respondidas** — una respuesta automática inadecuada destruye reputación. Aprobación humana obligatoria.
4. **Listings duplicados** — algunos directorios ya tienen ficha del brand sin permiso. Hay que "reclamarla" primero (proceso manual). Documentar como step del onboarding.
5. **Trackeo de conversiones es noisy** — bots/crawlers disparan clics fake. Mitigación: filtro user-agent + rate limit por IP.
6. **Dominio propio mal configurado** — TXT mal puesto, CNAME apuntando a sitio viejo. Mitigación: UI con verificación clara + retry semi-automático + soporte humano para el primer dominio.
7. **Límite de aliases Vercel** — Pro permite 50, Enterprise ilimitado. Si se vende a >50 brands con dominio propio simultáneo, upgrade necesario.
8. **SSL provisioning falla** — Vercel a veces tarda u ocasionalmente falla en emitir SSL. Cron verify-domains debe re-intentar y alertar si pasa >24h.

## 8. Verificación end-to-end

**Landings multi-dominio:**
1. Brand piloto con datos completos en Airtable y `slug = "chefcito"`.
2. Build → ver landing en `migraflix.com/r/chefcito` con todos los datos.
3. Activar subdominio: `subdomain = "chefcito"`, `subdomain_enabled = true` → acceder a `chefcito.migraflix.com` → debe renderizar la misma landing.
4. Conectar dominio propio: ingresar `chefcito.com` en `/dashboard/seo/dominio` → seguir instrucciones DNS (TXT + CNAME) → esperar verificación → acceder a `chefcito.com` con SSL activo → misma landing.
5. Validar `migraflix.com/sitemap.xml` lista todos los brands, y `chefcito.com/sitemap.xml` lista solo Chefcito.
6. Google Search Console: submit URL para los 3 dominios, verificar indexación + Schema.org sin errores.
7. Click "llamar" desde dominio propio → evento en `SeoEvents` con `source=custom_domain`.

**GMB:**
8. Conectar GMB del brand piloto → modificar horario en Airtable → cron diario sincroniza a GMB.
9. Publicar post GMB desde UI → verificar en perfil público.
10. Esperar reseña nueva (o simular) → IA propone respuesta → aprobar → ver publicada.
11. Pull métricas GMB → verificar tabla `GmbMetrics` con vistas/clics.

**Directorios:**
12. Sync de ficha a TripAdvisor (sandbox) → verificar update reflejado.
13. Reporte unificado en `/dashboard/seo` muestra conversiones del último mes desglosadas por canal (landing/gmb/directorios) y por dominio.
