import { BrandFormData } from "@/lib/validation/brand-schema";
import { inferLanguage, languageFromSession, sanitizeString, generateUploadPhotosLink } from "./utils";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
// SIEMPRE usar "Brands" como nombre de tabla (funciona en producción y desarrollo)
const TABLE_NAME = "Brands";

/**
 * Mapea los datos del formulario a los campos de Airtable
 */
export function mapFormDataToAirtable(
  formData: BrandFormData,
  status?: string,
  // Idioma de la sesión web ("pt" | "es"). Es la fuente PRINCIPAL de idioma;
  // el país solo se usa como respaldo si esto no viene.
  sessionLang?: string
) {
  const fields: Record<string, any> = {
    Negocio: sanitizeString(formData.negocio),
    "Call to Action (Whatsapp del negocio)": sanitizeString(formData.whatsapp),
  };

  // Campos opcionales
  // Emprendedor - SIEMPRE se guarda (incluso si está vacío)
  const emprendedorValue = (formData.emprendedor || "").trim();
  fields["Emprendedor"] = emprendedorValue;
  
  console.log("📝 Mapeando Emprendedor:", {
    original: formData.emprendedor,
    processed: emprendedorValue,
    willSave: fields["Emprendedor"]
  });

  // Email
  if (formData.correo) {
    fields["Email"] = sanitizeString(formData.correo);
  }

  if (formData.ciudad) {
    fields["Ciudad"] = sanitizeString(formData.ciudad);
  }

  if (formData.pais) {
    fields["País"] = sanitizeString(formData.pais);
  }

  // Idioma: principal = idioma real de la sesión web (pt/es); respaldo = país.
  // El país es opcional, así que inferirlo solo no basta (caía a "Español" por
  // default). Esto es lo que la automatización de SendPulse lee para el template.
  const idioma = languageFromSession(sessionLang);
  if (idioma) {
    fields["Idioma"] = idioma;
  } else if (formData.pais) {
    fields["Idioma"] = inferLanguage(formData.pais, formData.ciudad);
  }

  if (formData.instagram) {
    fields["Instagram del negocio"] = sanitizeString(formData.instagram);
  }

  if (formData.descripcion) {
    fields["Historia Emprendedor"] = sanitizeString(formData.descripcion);
  }

  // Agregar Status si se proporciona
  if (status) {
    fields["Status"] = status;
  }

  return fields;
}

/**
 * Actualiza el Status de un registro existente en Airtable
 */
export async function updateBrandStatus(
  recordId: string,
  status: string
) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error("Configuración de Airtable incompleta");
  }

  const encodedTableName = encodeURIComponent(TABLE_NAME);

  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodedTableName}/${recordId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          Status: status,
        },
        typecast: true,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Error updating brand status in Airtable:", errorData);
    throw new Error(
      errorData.error?.message || "Error al actualizar el status en Airtable"
    );
  }

  return await response.json();
}

/**
 * Actualiza campos adicionales de un registro existente en Airtable
 */
export async function updateBrandFields(
  recordId: string,
  formData: Partial<BrandFormData>,
  sessionLang?: string
) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error("Configuración de Airtable incompleta");
  }

  const fields = mapFormDataToAirtable(formData as BrandFormData, undefined, sessionLang);
  const encodedTableName = encodeURIComponent(TABLE_NAME);

  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodedTableName}/${recordId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields,
        typecast: true,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Error updating brand fields in Airtable:", errorData);
    throw new Error(
      errorData.error?.message || "Error al actualizar los campos en Airtable"
    );
  }

  return await response.json();
}

/**
 * Crea un nuevo registro de marca en Airtable
 */
export async function createBrand(
  formData: BrandFormData,
  status?: string,
  sessionLang?: string
) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error("Configuración de Airtable incompleta");
  }

  const fields = mapFormDataToAirtable(formData, status, sessionLang);
  const encodedTableName = encodeURIComponent(TABLE_NAME);

  // Crear registro en Airtable con mejor manejo de errores
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
        body: JSON.stringify({
          fields,
          typecast: true,
        }),
      }
    );
  } catch (fetchError) {
    console.error("Error de conexión con Airtable:", fetchError);
    throw new Error("Error de conexión con la base de datos. Verifica tu conexión a internet.");
  }

  if (!airtableResponse.ok) {
    let errorText;
    try {
      errorText = await airtableResponse.text();
    } catch (textError) {
      errorText = "No se pudo leer el error de Airtable";
    }

    console.error("Airtable error:", airtableResponse.status, errorText);

    // Dar mensajes más específicos según el código de error
    if (airtableResponse.status === 401) {
      throw new Error("Error de autenticación con la base de datos");
    } else if (airtableResponse.status === 403) {
      throw new Error("Acceso denegado a la base de datos");
    } else if (airtableResponse.status >= 500) {
      throw new Error("Error interno del servidor de base de datos. Intenta más tarde.");
    }

    throw new Error(`Error en base de datos: ${airtableResponse.status}`);
  }

  let data;
  try {
    data = await airtableResponse.json();
  } catch (jsonError) {
    console.error("Error parseando respuesta de Airtable:", jsonError);
    throw new Error("Respuesta inválida de la base de datos");
  }

  const recordId = data.id;

  // Generar y actualizar el link de fotos
  const uploadPhotosLink = generateUploadPhotosLink(recordId);

  try {
    await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodedTableName}/${recordId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            "Upload Fotos Link": uploadPhotosLink,
          },
          typecast: true,
        }),
      }
    );
  } catch (error) {
    console.error("Error updating upload photos link:", error);
    // No fallar si no se puede actualizar el link
  }

  return {
    recordId,
    uploadPhotosLink,
  };
}

