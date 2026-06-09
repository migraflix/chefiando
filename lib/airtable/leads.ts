import { LeadFormData, UtmParams } from "@/lib/validation/lead-schema";
import { sanitizeString } from "./utils";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
// Embudo unificado: los leads entran como Emprendedor con Status="Lead".
// Status flow: Lead -> Registrando -> Cuenta abierta (sin aprobacion manual).
// El Brand se linkea cuando completan el registro en /registro.
const TABLE_NAME = "Emprendedores";

function mapLeadToAirtable(
  formData: LeadFormData,
  origen: string,
  utm?: UtmParams
) {
  const fields: Record<string, unknown> = {
    Name: sanitizeString(formData.nombre),
    Negocio: sanitizeString(formData.negocio),
    WhatsApp: sanitizeString(formData.whatsapp),
    Email: sanitizeString(formData.email),
    Origen: origen,
    Fecha: new Date().toISOString(),
    Status: "Lead",
  };

  if (utm) {
    if (utm.utm_source) fields["UTM Source"] = sanitizeString(utm.utm_source);
    if (utm.utm_medium) fields["UTM Medium"] = sanitizeString(utm.utm_medium);
    if (utm.utm_campaign) fields["UTM Campaign"] = sanitizeString(utm.utm_campaign);
    if (utm.utm_term) fields["UTM Term"] = sanitizeString(utm.utm_term);
    if (utm.utm_content) fields["UTM Content"] = sanitizeString(utm.utm_content);
    if (utm.landing_path) fields["Landing Path"] = sanitizeString(utm.landing_path);
    if (utm.referrer) fields["Referrer"] = sanitizeString(utm.referrer);
    if (utm.click_id) fields["Click ID"] = sanitizeString(utm.click_id);
  }

  return fields;
}

/**
 * Dispara el webhook de contacto con los datos del lead recién creado.
 * No lanza error si falla: el lead ya quedó guardado en Airtable y el webhook
 * es un efecto secundario que no debe tumbar la respuesta al usuario.
 */
async function fireContactWebhook(payload: Record<string, unknown>) {
  const webhookUrl = process.env.CONTACT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("⚠️ CONTACT_WEBHOOK_URL no configurada; se omite el webhook de contacto");
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("Error en webhook de contacto:", response.status, await response.text().catch(() => ""));
    }
  } catch (error) {
    console.error("Error disparando webhook de contacto:", error);
  }
}

/**
 * Crea un lead en la tabla "Leads" de Airtable y dispara el webhook de contacto.
 */
export async function createLead(
  formData: LeadFormData,
  origen = "Landing",
  utm?: UtmParams
) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error("Configuración de Airtable incompleta");
  }

  const fields = mapLeadToAirtable(formData, origen, utm);
  const encodedTableName = encodeURIComponent(TABLE_NAME);

  let airtableResponse;
  try {
    airtableResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodedTableName}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields, typecast: true }),
      }
    );
  } catch (fetchError) {
    console.error("Error de conexión con Airtable:", fetchError);
    throw new Error("Error de conexión con la base de datos. Verifica tu conexión a internet.");
  }

  if (!airtableResponse.ok) {
    const errorText = await airtableResponse.text().catch(() => "");
    console.error("Airtable error (leads):", airtableResponse.status, errorText);

    if (airtableResponse.status === 401) throw new Error("Error de autenticación con la base de datos");
    if (airtableResponse.status === 403) throw new Error("Acceso denegado a la base de datos");
    if (airtableResponse.status >= 500) throw new Error("Error interno del servidor de base de datos. Intenta más tarde.");
    throw new Error(`Error en base de datos: ${airtableResponse.status}`);
  }

  const data = await airtableResponse.json();
  const recordId = data.id as string;

  // URL para que n8n pueda mandar el follow-up con un link al embudo donde quedaron.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const continueUrl = `${appUrl.replace(/\/$/, "")}/retomar/${recordId}`;

  // Disparar webhook de contacto (no bloqueante para la respuesta)
  await fireContactWebhook({
    recordId,
    origen,
    continueUrl,
    ...fields,
  });

  return { recordId };
}

/**
 * Actualiza los campos de un Emprendedor existente.
 * Uso interno: cambios de Status, linkeo a Brand.
 */
async function patchEmprendedor(recordId: string, fields: Record<string, unknown>) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error("Configuración de Airtable incompleta");
  }

  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${recordId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields, typecast: true }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    console.error("Airtable error (patch lead):", res.status, errorText);
    throw new Error(`Error actualizando lead: ${res.status}`);
  }
}

export async function markLeadRegistrando(recordId: string) {
  await patchEmprendedor(recordId, { Status: "Registrando" });
}

export async function linkLeadToBrand(recordId: string, brandRecordId: string) {
  await patchEmprendedor(recordId, { Brand: [brandRecordId] });
}

export async function markLeadCuentaAbierta(recordId: string, brandRecordId?: string) {
  const fields: Record<string, unknown> = { Status: "Cuenta abierta" };
  if (brandRecordId) {
    fields["Brand"] = [brandRecordId];
  }
  await patchEmprendedor(recordId, fields);
}

/**
 * Lee un Emprendedor para conocer su Status y datos de prefill.
 * Usado por /retomar/[leadId] para decidir a donde redirigir.
 */
export async function getLeadById(recordId: string) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error("Configuración de Airtable incompleta");
  }

  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${recordId}`,
    {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      cache: "no-store",
    }
  );

  if (res.status === 404) return null;
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    console.error("Airtable error (get lead):", res.status, errorText);
    throw new Error(`Error obteniendo lead: ${res.status}`);
  }

  const data = (await res.json()) as {
    id: string;
    fields: Record<string, unknown>;
  };
  return data;
}

/**
 * Busca el Emprendedor que tiene linkeado un Brand especifico.
 * Usado al final de /fotos/gracias para cerrar el embudo sin pasar leadId por query string.
 *
 * filterByFormula no puede buscar por recordId dentro de campos linked (devuelve
 * los nombres mostrados, no IDs). Filtramos en codigo a los candidatos con Brand
 * no vacio. Es OK para el volumen actual; reemplazar por un campo formula
 * "Brand Record ID" si la tabla crece.
 */
export async function findLeadByBrand(brandRecordId: string) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error("Configuración de Airtable incompleta");
  }

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}?filterByFormula=${encodeURIComponent("NOT({Brand} = '')")}&fields%5B%5D=Brand&fields%5B%5D=Status&pageSize=100`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    console.error("Airtable error (find lead by brand):", res.status, errorText);
    return null;
  }

  const data = (await res.json()) as {
    records?: Array<{ id: string; fields: { Brand?: string[] } }>;
  };

  const match = (data.records ?? []).find((r) =>
    (r.fields.Brand ?? []).includes(brandRecordId)
  );
  return match ?? null;
}
