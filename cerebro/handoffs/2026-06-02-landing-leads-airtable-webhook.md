---
titulo: Landing nueva ChefIAndo + flujo lead → Airtable → webhook
fecha: 2026-06-02
proyecto: chefiando
estado: codigo-listo-falta-verificar
tipo: handoff
tags: [landing, airtable, webhook, leads, vercel]
---

# Handoff: Landing nueva + captura de leads

## Objetivo
Rediseñar la landing de ChefIAndo (más compacta, CTA centrado) y conectar un
formulario simple de lead que escribe a una tabla **Leads** en Airtable y dispara
un **webhook de contacto**.

## Lo que YA quedó hecho (código completo, typecheck pasa)

### 1. Rediseño landing — `app/page.tsx`
- Eliminadas secciones **Features** y **CTA**. Se conservó el **Footer**.
- Hero ahora tiene **un solo botón centrado** (antes eran 2 en fila) → apunta a `/contacto`.
- Espaciados compactados:
  - Hero `py-20 md:py-32` → `py-14 md:py-20`, `space-y-8` → `space-y-6`
  - Stats `py-16` → `py-10`
  - Benefits `py-20 md:py-32` → `py-14 md:py-20`, `mb-16` → `mb-10`
  - Footer `py-12` → `py-10`
- Estructura final: Hero → Stats → Benefits ("Por qué elegir") → Footer.

### 2. Formulario de lead
- `app/contacto/page.tsx` — página nueva con el form en una Card.
- `components/forms/lead-form.tsx` — campos: nombre, negocio, correo, whatsapp.
  Validación Zod en cliente, POST a `/api/leads`, redirige a `/thank-you` (ya existía).

### 3. Backend lead → Airtable → webhook
- `lib/validation/lead-schema.ts` — schema Zod (reusa validación WhatsApp LATAM/España).
- `lib/airtable/leads.ts` — `createLead()` escribe en tabla **"Leads"** (separada de "Brands")
  y luego dispara `CONTACT_WEBHOOK_URL` con POST (no bloqueante: si el webhook falla,
  el lead ya quedó guardado).
- `app/api/leads/route.ts` — POST: valida y crea el lead.

### 4. Config
- `.env.example` — documentadas `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `CONTACT_WEBHOOK_URL`.

**Verificación hecha:** `npx tsc --noEmit` pasa sin errores.

## Lo que FALTA (el bloqueo por el que se hace este handoff)

El flujo NO se ha probado contra el API real porque **no hay claves de Airtable en local**:
- `.env.local` NO tiene `AIRTABLE_API_KEY` ni `AIRTABLE_BASE_ID` (solo NODE_ENV,
  NEXT_PUBLIC_DEFAULT_LANGUAGE, GOOGLE_APPLICATION_CREDENTIALS_JSON, TEST_UPLOAD).
- El proyecto NO está enlazado a Vercel localmente (no hay carpeta `.vercel`).
- Sesión Vercel activa como `gneuman` (org `gnb-labs`), pero **chefiando no apareció**
  en la primera página de `vercel project ls` — hay que paginar para encontrar el
  nombre exacto del proyecto (quizá se llame distinto, ej. "migraflix").

### Próximo paso concreto
1. `npx vercel link` apuntando al proyecto correcto (buscar con `vercel project ls --next ...`).
2. `npx vercel env pull .env.local` para traer AIRTABLE_API_KEY / AIRTABLE_BASE_ID /
   CONTACT_WEBHOOK_URL de producción.
3. **Crear la tabla `Leads` en Airtable** con campos exactos:
   `Nombre`, `Negocio`, `WhatsApp`, `Email`, `Origen`, `Fecha`.
4. Definir/confirmar `CONTACT_WEBHOOK_URL` (Make/Zapier/n8n).
5. `npm run dev`, abrir `/contacto`, enviar un lead de prueba y verificar:
   - aparece registro en tabla Leads,
   - el webhook recibe el POST.

## Decisiones tomadas (no re-preguntar)
- Eliminar: Features + CTA. Conservar Footer.
- Formulario: lead SIMPLE nuevo (no el /registro multi-paso de marca).
- Webhook: URL configurable en `.env` (`CONTACT_WEBHOOK_URL`), disparado desde el código.
- Ubicación form: página aparte `/contacto`.
- Tabla: nueva tabla "Leads" (NO reusar "Brands").

## MAA
- **Medir:** conversión landing → lead (sensor: campos Origen + Fecha en tabla Leads).
- **Analizar:** comparar vs. landing anterior tras 1 semana de datos.
- **Actuar:** ajustar copy/posición del CTA según números.

## Skills sugeridos para retomar
- `/setup-deploy` o `vercel link` manual para el enlace.
- `/verify` o `/browse` para probar `/contacto` end-to-end.
