import { NextRequest, NextResponse } from "next/server";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const CONTENT_TABLE_NAME = "Content";

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

    // Obtener datos del registro desde Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${CONTENT_TABLE_NAME}/${recordId}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`Error fetching record ${recordId}:`, response.statusText);
      // Si no hay registro, devolver placeholder
      return NextResponse.redirect(new URL('/placeholder.svg', request.url));
    }

    const data = await response.json();
    const record = data;

    // Buscar URL de GCS firmada primero, luego URL pública
    let imageUrl = null;

    if (record.fields?.["GCS Signed URL"]) {
      imageUrl = record.fields["GCS Signed URL"];
    } else if (record.fields?.["GCS Public URL"]) {
      imageUrl = record.fields["GCS Public URL"];
    } else if (record.fields?.["📥 Image"]?.[0]?.url) {
      // Fallback a URL de Airtable
      imageUrl = record.fields["📥 Image"][0].url;
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