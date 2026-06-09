---
titulo: "Bots IA por Restaurante: WhatsApp + Voz"
fecha: 2026-05-22
proyecto: chefiando
estado: draft
tipo: PRD
tags: [bots, ia, whatsapp, voz, sendpulse, wacrm, nlpearl, anthropic]
feature: F2
prioridad: P1
horas_estimadas: 100-145h
depende_de: [F1]
---

# F2 — Bots IA por Restaurante (WhatsApp + Voz)

> Sub-PRD del plan maestro `~/.claude/plans/tengo-que-planificar-estas-squishy-quiche.md`.

## 1. Contexto

Hoy Chefiando atiende consultas de clientes finales (comensales) **manualmente** desde el WhatsApp del restaurante. No hay automatización de atención por voz. Esto:
- Consume tiempo del dueño/staff.
- Pierde consultas fuera de horario.
- No mide CSAT ni patrones de demanda.

**Objetivo:** cada restaurante tiene un bot 24/7 que responde menú, horarios, ubicación, reservas básicas (WhatsApp texto) y opcionalmente atiende llamadas con un bot de voz que toma pedido/reserva y escala a humano cuando hace falta.

## 2. Outcome y MAA

- **Medir:** mensajes contestados por bot/mes/restaurante + % escalados a humano + CSAT post-conversación (encuesta 1-5 al cerrar).
- **Analizar:** baseline = 0 (no hay bots hoy). Comparar mes a mes. Buscar patrón de mensajes "no entendidos" para mejorar prompt.
- **Actuar:** si % handoff >50% → mejorar prompt o agregar FAQs. Si CSAT <3.5 → revisar tono. Cerrar ciclo en `/cierre-semana`.

## 3. Scope

**In-scope:**
- Bot WhatsApp por restaurante (texto): menú, horarios, ubicación, FAQs, reservas básicas, escalamiento a humano.
- Bot de voz para llamadas entrantes (opcional por brand).
- Knowledge base por brand: menú JSON, horarios, dirección, FAQs editables.
- Logging de conversaciones en Airtable (con archivado automático).
- Onboarding: UI guiada para que el restaurante configure su bot.
- Handoff a humano vía notificación WhatsApp al dueño.

**Out-of-scope:**
- Cobro/billing del uso (eso es F5).
- Bot que postea en IG automático (eso es F1 + F4).
- Multi-idioma per-conversation (se hereda del campo `Idioma` del brand).
- Integración con sistemas de POS o reservas externas (Resy, OpenTable).

## 4. Decisiones de diseño

| Decisión | Elección | Razón |
|----------|----------|-------|
| Proveedor WhatsApp | **SendPulse** (ya en uso) + evaluar wacrm como benchmark | Ya está pago + integrado |
| LLM | Claude Haiku 4.5 (default GNB) | Costo/latencia/calidad — alineado con CLAUDE.md global |
| Proveedor voz | nlpearl | Mejor DX y baseline de latencia |
| Knowledge base | Airtable per-brand (no vector store en MVP) | Volumen chico, prompt context suficiente |
| Log conversaciones | Airtable, 1 row por conversación con `messages_json` | Plan maestro: todo Airtable, anti-bloat |

## 5. Diseño técnico

### Flow WhatsApp
```
[Cliente envía mensaje a número del restaurante]
   ↓
[SendPulse webhook → POST /api/bots/whatsapp/webhook]
   ↓ identificar brand por número destino
   ↓ cargar BotConfig + history (Conversations row activa)
   ↓ promptBuilder.build(brand, history, user_message)
   ↓ Claude Haiku → respuesta
   ↓ ¿necesita handoff? → notif WhatsApp al dueño
   ↓ enviar respuesta vía SendPulse API
   ↓ append message a Conversations row (JSON)
```

### Flow Voz
```
[Cliente llama al número nlpearl del restaurante]
   ↓
[nlpearl webhook → POST /api/bots/voice/webhook]
   ↓ identificar brand por número
   ↓ cargar BotConfig + voice persona
   ↓ nlpearl orchestra: STT → Claude → TTS (ElevenLabs)
   ↓ logging de transcript + duración
   ↓ si pide reserva → llenar form → confirmar → notif WhatsApp dueño
```

### Schema Airtable

**`BotConfigs`** (1 row por brand):
- `brandId` (Link to Brands)
- `whatsapp_enabled` (Checkbox)
- `voice_enabled` (Checkbox)
- `whatsapp_number` (Text)
- `voice_number` (Text)
- `bot_persona` (Long text — system prompt custom o vacío para default)
- `menu_json` (Long text JSON)
- `horarios` (Long text)
- `direccion` (Text)
- `faqs_json` (Long text JSON array)
- `handoff_keywords` (Multi-select: queja, reserva grupo, alergia, urgente)
- `handoff_notify_phone` (Text — WhatsApp del dueño)

**`Conversations`** (1 row por conversación):
- `brandId` (Link)
- `channel` (Select: whatsapp / voice)
- `customer_id` (Text — número WhatsApp o telefónico)
- `messages_json` (Long text — array `[{role,content,timestamp}]`)
- `messages_count` (Number)
- `tokens_used` (Number)
- `cost_estimated_usd` (Number)
- `duration_seconds` (Number — solo voz)
- `created_at`, `last_message_at`, `closed_at` (DateTime)
- `status` (Select: active / closed / handoff)
- `csat_rating` (Number 1-5 nullable)

**`Conversations_Archive`** — mismo schema, recibe rows >90 días via job mensual.

### Files nuevos
- `lib/bots/whatsapp.ts` (cliente SendPulse — wrapper con retry y throttle)
- `lib/bots/voice.ts` (cliente nlpearl)
- `lib/bots/prompt-builder.ts`
- `lib/bots/llm.ts` (wrapper Anthropic Claude Haiku 4.5)
- `lib/bots/conversation-logger.ts`
- `lib/bots/airtable-throttle.ts` (queue 4 req/seg)
- `lib/bots/handoff.ts`
- `app/api/bots/whatsapp/webhook/route.ts`
- `app/api/bots/voice/webhook/route.ts`
- `app/api/cron/archive-conversations/route.ts` (mensual)
- `app/dashboard/bot/page.tsx` (config)
- `app/dashboard/bot/conversaciones/page.tsx` (historial)

## 6. Tareas granulares

| # | Tarea | Horas |
|---|-------|-------|
| 1 | Comparativa SendPulse vs wacrm (POC corto) | 6 |
| 2 | Setup webhooks WhatsApp en proveedor elegido | 4 |
| 3 | Schema `BotConfigs` + `Conversations` + `Conversations_Archive` | 5 |
| 4 | UI `/dashboard/bot` (config: menú, horarios, FAQs, persona) | 12 |
| 5 | Prompt builder dinámico por brand | 6 |
| 6 | Wrapper Anthropic + manejo errores + retries | 5 |
| 7 | Webhook entrada WhatsApp → procesar → responder | 10 |
| 8 | Logger conversaciones + medición tokens/costo | 6 |
| 9 | Handoff a humano (detección keywords + notif) | 6 |
| 10 | UI historial conversaciones (búsqueda + filtros) | 10 |
| 11 | Setup nlpearl + número asignado | 6 |
| 12 | Webhook voz → reservas/pedidos | 12 |
| 13 | Transcripción + log de llamadas | 5 |
| 14 | Tests con cuentas reales (1 brand piloto) | 10 |
| 15 | Onboarding: cómo conectar WhatsApp del restaurante | 6 |
| 16 | Rate limiting + protección abuso por brand | 5 |
| 17 | Docs cliente: cómo entrenar al bot | 4 |
| 18 | Throttling escrituras Airtable (queue + retry) | 2 |
| 19 | Job mensual archivado a `Conversations_Archive` | 3 |
| **Total** | | **123h** |
| **Rango con buffers** | | **100–145h** |

## 7. Supuestos y riesgos

**Supuestos:**
- SendPulse permite multi-número con webhooks por número (validar en POC tarea #1).
- F5 (billing) está armado antes de escalar a >5 brands con bots activos.
- Brands aceptan que el bot use su número WhatsApp (o se les asigna nuevo).

**Riesgos:**
- Calidad del bot = calidad del prompt + datos. Mitigación: UI guiada de onboarding + revisión humana en piloto.
- Costos variables sin control → no escalar sin F5.
- Volumen Airtable: con 50 brands x 200 conversaciones/mes = 10k rows. Archivado mantiene activa <30k.

## 8. Verificación end-to-end

1. Configurar bot de brand piloto en `/dashboard/bot`: menú, horarios, FAQs.
2. Enviar WhatsApp al número del brand desde celular personal con preguntas comunes ("¿horarios?", "¿menú?").
3. Bot responde en <5s con info correcta. Logueado en Airtable `Conversations`.
4. Enviar "quiero hacer reserva para 12 personas" → bot escala a humano → llega notif WhatsApp al dueño.
5. Llamar al número nlpearl del brand → bot saluda → cliente pide reserva → bot la toma → confirmación.
6. Verificar costo estimado en `tokens_used` y `cost_estimated_usd`.
7. Esperar 90 días o forzar archivado → verificar que conversación viejas pasaron a `Conversations_Archive`.
