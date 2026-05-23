# Planes — Chefiando / Migraflix

Índice de PRDs y planes técnicos. Cada archivo es un plan revisable y aprobable por separado.

## Mayo 2026 — Lote "Plataforma Multi-tenant + IA + SEO"

**v2 — 2026-05-22:** F5 Billing removido (Chefiando absorbe costos). F1 absorbe Stories/Reels + posts agendados. F4 absorbe landings multi-dominio (slug + subdominio + dominio propio).

Plan maestro (overview ejecutivo): `~/.claude/plans/tengo-que-planificar-estas-squishy-quiche.md` (local de Gabriel).

| # | Feature | PRD | Estado | Horas | Prioridad |
|---|---------|-----|--------|-------|-----------|
| F1 | Login IG + Multi-tenant + Publicación (feed/Stories/Reels + agendar) | [2026-05-22-login-ig-multitenant.md](./2026-05-22-login-ig-multitenant.md) | draft | 102–134h (+16-32h Meta) | 🔴 P0 |
| F2 | Bots IA WhatsApp (SendPulse) + Voz (nlpearl) | [2026-05-22-bots-ia-restaurantes.md](./2026-05-22-bots-ia-restaurantes.md) | draft | 100–145h | 🟡 P1 |
| F3 | Sentry: auditoría + triage + Linear | [2026-05-22-sentry-auditoria.md](./2026-05-22-sentry-auditoria.md) | draft | 26–38h | 🟢 P2 (quick-win) |
| F4 | SEO automatizado: landings multi-dominio + GMB + directorios | [2026-05-22-seo-automatizado.md](./2026-05-22-seo-automatizado.md) | draft | 170–225h | 🟡 P1 |
| **Total** | | | | **398–542h** | |

**Orden recomendado:** F3 → F1 → F4 → F2.

## Decisiones transversales (aplican a todos los PRDs)

- **Base de datos:** Airtable para todo. No migrar a Supabase en este lote. Trigger de migración futura: >1.500 brands o >30k conversaciones/mes.
- **Cuentas IG:** Mixto. Personal puede entrar pero no publicar.
- **Bots — costos:** Chefiando los absorbe. Sin billing ni tracking de uso en este lote. Si gasto mensual supera umbral acordado, levantar F5 Billing como nueva fase cotizable.
- **F4 multi-dominio:** los landings funcionan en `/r/[slug]`, en subdominio wildcard `[brand].migraflix.com`, y en dominio propio del brand vía CNAME. Diseñado para revender como producto a futuro.
- **MAA obligatorio:** cada feature declara métrica antes de empezar dev. Revisar en `/cierre-semana`.
- **Idioma código + UI:** Español LATAM, sin voseo en .tsx/.md.

## Cómo trabajar un PRD

1. Cliente revisa el PRD → ajustes/aprobación.
2. Cotizar con `/cotizar` o `/calculadora-precio` usando las horas granulares.
3. Crear proyecto + issues en Linear con label `feature-<N>`.
4. Al cerrar feature: retro MAA en `/cierre-semana`.
