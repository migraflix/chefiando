import { NextRequest, NextResponse } from "next/server";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const CONTENT_TABLE_NAME = "Content";
const PHOTOS_TABLE_NAME = "Fotos AI";

/**
 * Endpoint para servir imágenes desde GCS usando el recordId de Content
 * Esto evita problemas con URLs expiradas de Airtable
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  try {
    const { recordId } = await params;

    if (!recordId) {
      return NextResponse.json(
        { error: "Record ID is required" },
        { status: 400 }
      );
    }

    // Función para buscar datos de imagen en una tabla
    const findImageData = async (tableName: string, recordId: string) => {
      try {
        const response = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}/${recordId}`,
          {
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            },
          }
        );

        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        const record = data;

        // Buscar URL de GCS firmada primero, luego URL pública
        if (record.fields?.["GCS Signed URL"]) {
          return record.fields["GCS Signed URL"];
        } else if (record.fields?.["GCS Public URL"]) {
          return record.fields["GCS Public URL"];
        } else if (record.fields?.["📥 Image"]?.[0]?.url) {
          // Fallback a URL de Airtable
          return record.fields["📥 Image"][0].url;
        }

        return null;
      } catch (error) {
        console.warn(`Error searching in ${tableName}:`, error);
        return null;
      }
    };

    // Buscar primero en tabla Content (posts generados)
    let imageUrl = await findImageData(CONTENT_TABLE_NAME, recordId);

    // Si no se encuentra en Content, buscar en Fotos AI (productos originales)
    if (!imageUrl) {
      console.log(`🔍 Imagen no encontrada en Content, buscando en Fotos AI para ${recordId}`);
      imageUrl = await findImageData(PHOTOS_TABLE_NAME, recordId);
    }

    if (!imageUrl) {
      // No hay imagen, devolver placeholder
      return NextResponse.redirect(new URL('/placeholder.svg', request.url));
    }

    // Redirigir a la URL de la imagen
    // Esto permite que el navegador maneje el cache y evita problemas de CORS
    return NextResponse.redirect(imageUrl);

  } catch (error) {
    console.error('Error serving image:', error);

    // En caso de error, devolver placeholder
    return NextResponse.redirect(new URL('/placeholder.svg', request.url));
  }
}