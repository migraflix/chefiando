---
titulo: "Auditoría Sentry + Triage + Integración Linear"
fecha: 2026-05-22
proyecto: chefiando
estado: draft
tipo: PRD
tags: [sentry, observabilidad, linear, alertas, runbook]
feature: F3
prioridad: P2
horas_estimadas: 26-38h
depende_de: []
---

# F3 — Auditoría Sentry + Triage + Integración Linear

> Sub-PRD del plan maestro. Quick-win: la feature más rápida del lote y la más alta en valor/hora.

## 1. Contexto

Sentry ya está instalado:
- `sentry.client.config.ts:1-78` con replays + tracesSampleRate.
- `sentry.server.config.ts`, `sentry.edge.config.ts`.
- DSN viene de `NEXT_PUBLIC_SENTRY_DSN`.

**Pero:**
- No hay certeza que el DSN esté seteado en Vercel producción.
- Hay 9+ docs en `/docs/` sobre Sentry (`SENTRY_CONFIGURACION_COMPLETA.md`, `VERIFICAR_SENTRY_PRODUCCION.md`, etc) — señal de que la configuración fue dolorosa y no quedó cerrada.
- No hay alertas configuradas, no hay runbook, no hay integración con Linear.

**Objetivo:** dejar Sentry en estado "Listo" — auditoría + triage + alertas + loop Sentry↔Linear cerrado.

## 2. Outcome y MAA

- **Medir:** errores únicos abiertos en Sentry / mes + MTTR (mean time to resolution) de errores críticos.
- **Analizar:** baseline hoy = desconocido (auditoría inicial). Meta trimestre 1: <10 errores únicos abiertos, MTTR <48h.
- **Actuar:** errores top-5 con runbook documentado en `docs/sentry-runbook.md`. Revisar tendencias en `/cierre-semana`.

## 3. Scope

**In-scope:**
- Auditoría config (DSN, sampling, ignoreErrors, releases, source maps).
- Triage de errores activos: priorización + reporte.
- Alertas: nuevo error, spike, error crítico.
- Integración bidireccional Sentry ↔ Linear (issue auto-creado + auto-cierre).
- Runbook con top-5 errores comunes.

**Out-of-scope:**
- Fix de los errores (eso es trabajo separado, post-triage).
- Performance monitoring deep (tracesSampleRate ya OK).
- Sentry SDK migration (versión actual `^10.34.0` está bien).

## 4. Diseño técnico

### Fase 1 — Auditoría (qué validar)

| Check | Cómo | Esperado |
|-------|------|----------|
| DSN en Vercel prod | `vercel env ls` | `NEXT_PUBLIC_SENTRY_DSN` set en Production |
| DSN en Vercel preview | idem | Set también |
| Cliente envía errores | trigger error en `/admin`, ver Sentry | Error aparece |
| Server envía errores | trigger error en API route, ver Sentry | Error aparece |
| Edge envía errores | trigger error en middleware, ver Sentry | Error aparece |
| Source maps | revisar build logs Vercel + Sentry releases | Source maps suben en build |
| `ignoreErrors` (`sentry.client.config.ts:49-63`) | revisar lista | Apropiada, no over-filtering |
| `tracesSampleRate` prod 0.1, dev 1 | leer config | OK |
| Replays config | leer config | OK |

### Fase 2 — Triage

- API de Sentry (`https://sentry.io/api/0/projects/<org>/<proj>/issues/`) para listar errores activos.
- Agrupar por frecuencia (events count) e impacto (users affected).
- Reporte priorizado: top 10 → critical (fix ahora) / high (esta semana) / low (backlog).
- Output: `docs/sentry-triage-2026-05.md` con lista.

### Fase 3 — Alertas

3 alertas mínimo (configurar en UI Sentry):
1. **Nuevo error**: primera ocurrencia en últimas 24h.
2. **Spike**: >10 events del mismo issue en 1h.
3. **Crítico**: error afecta >5 usuarios únicos en 1h.

Destino: Slack del cliente o email.

### Fase 4 — Integración Linear

**Flow Sentry → Linear:**
```
[Sentry detecta nuevo issue crítico]
   ↓ webhook a /api/integrations/sentry-to-linear
   ↓ payload: { issue_id, title, culprit, level, users_affected, replay_url }
   ↓ Linear API: create issue
     - title: "[Sentry] {title}"
     - description: stack trace + replay + link a Sentry
     - team: equipo del cliente
     - label: "sentry-auto"
     - priority: high si crítico
   ↓ guardar mapping issue_id ↔ linear_id en Airtable `SentryLinearMap`
```

**Flow Linear → Sentry (cierre):**
```
[Linear issue se mueve a Done]
   ↓ Linear webhook a /api/integrations/linear-to-sentry
   ↓ buscar mapping issue_id
   ↓ Sentry API: resolve issue
```

### Files nuevos
- `lib/integrations/sentry.ts` (cliente Sentry API)
- `lib/integrations/linear.ts` (cliente Linear API)
- `app/api/integrations/sentry-to-linear/route.ts`
- `app/api/integrations/linear-to-sentry/route.ts`
- `docs/sentry-runbook.md`
- `docs/sentry-triage-2026-05.md` (entregable de triage)

### Files a modificar
- `sentry.client.config.ts:49-63` — ajustar `ignoreErrors` si triage detecta falsos positivos.

## 5. Tareas granulares

| # | Tarea | Horas |
|---|-------|-------|
| 1 | Verificar DSN en Vercel (prod + preview) | 1 |
| 2 | Validar envío desde client/server/edge con test errors | 2 |
| 3 | Configurar Source Maps upload en build | 3 |
| 4 | Revisar y ajustar `ignoreErrors` | 1 |
| 5 | Configurar releases (asociar deploys a versiones) | 2 |
| 6 | Triage errores actuales + reporte priorizado | 4 |
| 7 | Configurar 3 alertas (Slack o email) | 3 |
| 8 | Endpoint webhook `sentry-to-linear` | 5 |
| 9 | Cliente Linear con templates de issue | 4 |
| 10 | Webhook reverso Linear → resolve Sentry | 4 |
| 11 | Vistas custom Sentry (por tipo de error) | 3 |
| 12 | Runbook top-5 errores comunes | 4 |
| 13 | Testing loop completo Sentry→Linear→fix→cierre | 2 |
| **Total** | | **38h** |
| **Rango con buffers** | | **26–38h** |

## 6. Supuestos y riesgos

**Supuestos:**
- Cliente tiene workspace Linear (sí, lo usa GNB).
- Plan Sentry permite webhooks (sí, hasta Team plan).
- Token Linear con permisos `write:issues`.

**Riesgos:**
- **Webhook loop:** si Linear resuelve y Sentry re-abre por nuevo evento → loop. Mitigación: ignorar reaperturas si pasaron <30 días desde resolución manual.
- **Spam de issues Linear:** si Sentry crea uno por cada error nuevo → ruido. Mitigación: crear issue solo si level >= warning Y users_affected >= 2.

## 7. Verificación end-to-end

1. Trigger error en `/admin` desde prod → ver llegada a Sentry.
2. Validar source map: stack trace muestra archivo + línea original, no minified.
3. Sentry crea issue → llega webhook → Linear issue creado con stack + replay link.
4. Cambiar Linear issue a "Done" → Sentry issue marca como resolved.
5. Esperar alerta (forzar 10 errores del mismo tipo) → llega notif Slack.
6. Validar `docs/sentry-triage-2026-05.md` con top errores priorizados.
