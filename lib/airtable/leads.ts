import { LeadFormData } from "@/lib/validation/lead-schema";
import { sanitizeString } from "./utils";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
// Tabla dedicada a leads de campaña (separada de "Brands").
// Crear en Airtable con los campos: Nombre, Negocio, WhatsApp, Email, Origen, Fecha.
const TABLE_NAME = "Leads";

/**
 * Mapea los datos del formulario de lead a los campos de Airtable.
 */
function mapLeadToAirtable(formData: LeadFormData, origen: string) {
  return {
    Nombre: sanitizeString(formData.nombre),
    Negocio: sanitizeString(formData.negocio),
    WhatsApp: sanitizeString(formData.whatsapp),
    Email: sanitizeString(formData.email),
    Origen: origen,
    Fecha: new Date().toISOString(),
  };
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
export async function createLead(formData: LeadFormData, origen = "Landing") {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error("Configuración de Airtable incompleta");
  }

  const fields = mapLeadToAirtable(formData, origen);
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

  // Disparar webhook de contacto (no bloqueante para la respuesta)
  await fireContactWebhook({
    recordId,
    origen,
    ...fields,
  });

  return { recordId };
}
