import { type NextRequest, NextResponse } from "next/server"

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const TABLE_NAME = "Content"

export async function POST(request: NextRequest) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: "Configuración de Airtable incompleta" }, { status: 500 })
  }

  try {
    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ records: [] })
    }

    // Airtable URL length limit is ~16k characters.
    // We'll batch requests if necessary, but for now let's assume < 50 items per brand is typical.
    // If ids > 50, we should split.
    const chunks = []
    const chunkSize = 50
    for (let i = 0; i < ids.length; i += chunkSize) {
      chunks.push(ids.slice(i, i + chunkSize))
    }

    const allRecords = []

    for (const chunk of chunks) {
      const filterFormula = `OR(${chunk.map((id: string) => `RECORD_ID()='${id}'`).join(",")})`
      
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}?filterByFormula=${encodeURIComponent(filterFormula)}`,
        {
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          },
        }
      )

      if (!response.ok) {
        console.error(`Error fetching batch: ${response.statusText}`)
        continue
      }

      const data = await response.json()
      if (data.records) {
        allRecords.push(...data.records)
      }
    }

    return NextResponse.json({ records: allRecords })
  } catch (error) {
    console.error("Error fetching batch from Airtable:", error)
    return NextResponse.json({ error: "Error al cargar el contenido" }, { status: 500 })
  }
}
