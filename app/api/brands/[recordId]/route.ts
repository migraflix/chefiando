import { type NextRequest, NextResponse } from "next/server"

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
// Usar ID de tabla para mayor confiabilidad (también funciona con "Brands")
const TABLE_NAME = process.env.AIRTABLE_BRANDS_TABLE_ID || "apprcCvYyrWqDXKay"

export async function GET(request: NextRequest, { params }: { params: Promise<{ recordId: string }> }) {
  const { recordId } = await params

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: "Configuración de Airtable incompleta" }, { status: 500 })
  }

  try {
    const encodedTableName = encodeURIComponent(TABLE_NAME)

    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodedTableName}/${recordId}`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error("Error al obtener el registro de Airtable")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching brand from Airtable:", error)
    return NextResponse.json({ error: "Error al cargar la marca" }, { status: 500 })
  }
}
