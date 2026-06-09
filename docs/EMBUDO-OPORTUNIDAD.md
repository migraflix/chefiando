# Embudo de captacion ChefIAndo — Guia para marketing

Este documento explica como armar campanas, agregar UTMs y medir resultados del embudo de oportunidad. Esta pensado para quien lanza anuncios en Meta, Google, TikTok o email — no necesitas saber programar.

---

## 1. La URL del anuncio

La landing donde se llenan los datos es:

```
https://app.migraflix.com/oportunidad
```

Cuando alguien la abre, ve un formulario corto (nombre, negocio, WhatsApp, email). Si lo completa, pasa a una segunda pantalla donde termina de registrar su negocio. Cuando sube las primeras fotos, queda activo como cliente.

---

## 2. Como agregar UTMs

Pega los UTMs como parametros al final de la URL. Ejemplo completo:

```
https://app.migraflix.com/oportunidad?utm_source=facebook&utm_medium=cpc&utm_campaign=lanzamiento-mx&utm_content=video-A&utm_term=tacos
```

### Que significa cada UTM

| Parametro | Para que sirve | Ejemplos validos |
|---|---|---|
| `utm_source` | De donde viene (la red o canal) | `facebook`, `instagram`, `google`, `tiktok`, `email`, `whatsapp` |
| `utm_medium` | Tipo de trafico | `cpc` (pagado), `social` (organico), `email`, `referral`, `display` |
| `utm_campaign` | Nombre de la campana | `lanzamiento-mx`, `black-friday`, `retargeting-q2` |
| `utm_content` | Variante del creativo (para A/B) | `video-A`, `video-B`, `carrusel-1`, `imagen-cocinero` |
| `utm_term` | Palabra clave o segmento | `tacos`, `restaurantes-cdmx`, `chefs-jovenes` |

### Reglas para que no se rompa

- Sin espacios. Usa `-` en lugar de ` ` (ej: `lanzamiento-mx`, no `lanzamiento mx`).
- Todo minusculas (`facebook`, no `Facebook`). Importa para reportes.
- Sin acentos ni n (mejor `lanzamiento-mexico` que `lanzamiento-méxico`).
- Mantener nombres consistentes entre campanas: si usas `facebook` en un lado y `Meta` en otro, los reportes los cuentan separado.

---

## 3. Que se captura automaticamente

Ademas de los UTMs que tu pongas, el sistema captura SOLO si vienen en la URL:

- **`fbclid`** — click ID de Meta (Facebook/Instagram Ads). Lo agrega Meta automaticamente.
- **`gclid`** — click ID de Google Ads. Lo agrega Google automaticamente.
- **`ttclid`** — click ID de TikTok.
- **`msclkid`** — click ID de Microsoft/Bing.

No necesitas ponerlos tu — vienen solos cuando el usuario llega desde un anuncio pagado. Sirven para reportar conversiones offline de vuelta a la red de anuncios.

Tambien se guarda:
- La pagina exacta de llegada (`Landing Path`).
- De donde venia el usuario (`Referrer`).

---

## 4. Donde ver los datos

Los leads viven en Airtable, base ChefIAndo, tabla **Emprendedores**.

Cada lead tiene estos campos relevantes para medir:

| Campo | Que contiene |
|---|---|
| `Name`, `Negocio`, `Email`, `WhatsApp` | Datos basicos |
| `Status` | Etapa del embudo (ver abajo) |
| `Fecha` | Cuando llego el lead |
| `Origen` | `Oportunidad` (de la landing) o `Landing` (de /contacto viejo) |
| `UTM Source` / `Medium` / `Campaign` / `Term` / `Content` | Lo que pusiste en la URL |
| `Landing Path` | La ruta exacta de llegada |
| `Referrer` | Sitio anterior |
| `Click ID` | `fbclid=XYZ` o `gclid=XYZ` |
| `Brand` | Linkea al negocio creado (solo si avanzo) |

---

## 5. Los 3 estados del embudo

| Status | Que significa | Que hacer con ellos |
|---|---|---|
| `Lead` | Llenaron el form corto pero NO entraron al registro completo | Follow-up agresivo (mismo dia / 24 hrs) — son tibios pero perdibles. Usa el `continueUrl` del webhook |
| `Registrando` | Estan a medias dentro del registro completo | Recordatorio mas firme — ya intentaron pero algo los freno. Usa el `continueUrl` |
| `Cuenta abierta` | Completaron todo el embudo (registro + fotos) | **Estos son los que cuentan como conversion** |

---

## 6. KPIs que ya puedes medir

Con los UTMs y el campo `Status`, en Airtable puedes filtrar y responder:

**Cuantas conversiones por campana:**
```
Filter: {Status} = "Cuenta abierta" AND {UTM Campaign} = "lanzamiento-mx"
```

**Drop-off por etapa (donde se caen):**
- Total leads: `{Origen} = "Oportunidad"`
- Llegaron al paso 2: `{Status} = "Registrando" OR {Status} = "Cuenta abierta"`
- Terminaron: `{Status} = "Cuenta abierta"`

**Tasa de conversion de un creativo (A vs B):**
```
A: {UTM Content} = "video-A"
B: {UTM Content} = "video-B"
```
Cuentas cuantos en cada uno tienen `{Status} = "Cuenta abierta"` y comparas.

**Costo por lead (CPL) y costo por cuenta abierta:**
- Cuentas leads con `{UTM Campaign} = "X"` y divides entre gasto de esa campana.
- Lo mismo con `Cuenta abierta`. Te dice cual campana realmente paga.

---

## 7. Webhook de follow-up (que recibe n8n)

Cuando alguien llena el form, ademas de guardarse en Airtable, se dispara un webhook con TODOS los datos al workflow `adsFollowUp` en n8n.

El payload incluye un campo especial llamado **`continueUrl`** — esa URL es UNICA por lead y permite que el usuario retome el flujo donde lo dejo. La estructura es:

```
https://app.migraflix.com/retomar/[recordId]
```

Cuando el usuario abre esa URL:
- Si estaba en `Lead`, lo manda a `/registro` con sus datos pre-llenados.
- Si estaba en `Registrando`, lo manda al paso donde quedo.
- Si ya completo (`Cuenta abierta`), lo manda a la pantalla de gracias.

En el mensaje de WhatsApp o email de follow-up, **incluye siempre el `continueUrl`** — no le pidas que repita los datos.

---

## 8. Como probar antes de lanzar

Antes de poner dinero, manda 1-2 leads de prueba para verificar que la atribucion funciona:

1. Toma tu URL de prueba con UTMs unicos (algo como `utm_campaign=PRUEBA-MANUAL-2026-06-09`).
2. Abrela en una ventana privada del navegador.
3. Llena el form completo. Usa un email/wpp tuyo.
4. Verifica en Airtable que:
   - Aparece el record.
   - Los campos UTM tienen lo que esperabas.
   - El `Status` avanza correctamente conforme llenas el siguiente paso.

Si todo coincide, ya puedes lanzar la campana real.

---

## 9. Resumen ejecutivo

1. **Pon UTMs en TODOS los anuncios.** Sin UTMs no hay forma de saber que funciona.
2. **Usa nombres consistentes** entre campanas (siempre `facebook`, no `FB` ni `Facebook`).
3. **Mide `Cuenta abierta`, no `Lead`.** Un lead que no completa no es conversion.
4. **Usa el `continueUrl` del webhook** en los mensajes de retargeting — no le hagas repetir datos.
5. **Antes de lanzar pauta nueva, manda 1 lead de prueba** y verifica en Airtable.
