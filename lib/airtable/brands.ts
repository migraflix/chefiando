import { BrandFormData } from "@/lib/validation/brand-schema";
import { inferLanguage, sanitizeString, generateUploadPhotosLink } from "./utils";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = "Brands";

/**
 * Mapea los datos del formulario a los campos de Airtable
 */
export function mapFormDataToAirtable(formData: BrandFormData) {
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

  if (formData.ciudad) {
    fields["Ciudad"] = sanitizeString(formData.ciudad);
  }

  if (formData.pais) {
    fields["País"] = sanitizeString(formData.pais);
    // Inferir idioma automáticamente
    fields["Idioma"] = inferLanguage(formData.pais, formData.ciudad);
  }

  if (formData.instagram) {
    fields["Instagram del negocio"] = sanitizeString(formData.instagram);
  }

  if (formData.descripcion) {
    fields["Historia Emprendedor"] = sanitizeString(formData.descripcion);
  }

  return fields;
}

/**
 * Crea un nuevo registro de marca en Airtable
 */
export async function createBrand(formData: BrandFormData) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error("Configuración de Airtable incompleta");
  }

  const fields = mapFormDataToAirtable(formData);
  const encodedTableName = encodeURIComponent(TABLE_NAME);

  // Crear registro en Airtable
  const response = await fetch(
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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Error creating brand in Airtable:", errorData);
    throw new Error(
      errorData.error?.message || "Error al crear el registro en Airtable"
    );
  }

  const data = await response.json();
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

