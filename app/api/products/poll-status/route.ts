import { NextRequest, NextResponse } from "next/server";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const PHOTOS_TABLE_NAME = "Fotos AI";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get("recordId");

  if (!recordId) {
    return NextResponse.json(
      { error: "recordId es requerido" },
      { status: 400 }
    );
  }

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json(
      { error: "Configuración de Airtable incompleta" },
      { status: 500 }
    );
  }

  try {
    const encodedTableName = encodeURIComponent(PHOTOS_TABLE_NAME);
    
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodedTableName}/${recordId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error obteniendo record ${recordId}:`, errorText);
      return NextResponse.json(
        { error: "Error obteniendo estado del registro", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const status = data.fields?.Status || "Pendiente";
    
    return NextResponse.json({
      recordId,
      status,
      isReady: status === "Por Revisar",
      fields: {
        nombre: data.fields?.Nombre,
        status: status,
      }
    });
  } catch (error) {
    console.error("Error en poll-status:", error);
    return NextResponse.json(
      { error: "Error interno", details: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
