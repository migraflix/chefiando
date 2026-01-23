import { NextRequest, NextResponse } from "next/server";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const CONTENT_TABLE_NAME = "Content";

/**
 * Endpoint para forzar refresh de URLs de imagen de Airtable
 * Útil cuando las URLs expiran y necesitamos obtener URLs frescas
 */
export async function POST(
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

    console.log(`🔄 Forzando refresh de imagen para record ${recordId}`);

    // Obtener datos frescos del registro desde Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${CONTENT_TABLE_NAME}/${recordId}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          // Forzar no-cache en la petición a Airtable
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      }
    );

    if (!response.ok) {
      console.error(`Error fetching fresh data for ${recordId}:`, response.statusText);
      return NextResponse.json(
        { error: "No se pudo obtener datos frescos del registro" },
        { status: 404 }
      );
    }

    const data = await response.json();
    const record = data;

    // Extraer URLs de imagen disponibles
    const imageData = {
      airtableUrl: record.fields?.["📥 Image"]?.[0]?.url || null,
      gcsSignedUrl: record.fields?.["GCS Signed URL"] || null,
      gcsPublicUrl: record.fields?.["GCS Public URL"] || null,
      lastUpdated: new Date().toISOString(),
    };

    console.log(`✅ URLs frescas obtenidas para ${recordId}:`, {
      hasAirtable: !!imageData.airtableUrl,
      hasGcsSigned: !!imageData.gcsSignedUrl,
      hasGcsPublic: !!imageData.gcsPublicUrl,
    });

    return NextResponse.json({
      success: true,
      recordId,
      imageData,
      message: "URLs de imagen refrescadas"
    });

  } catch (error) {
    console.error('Error refreshing image URLs:', error);

    return NextResponse.json(
      {
        error: 'Error al refrescar URLs de imagen',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}