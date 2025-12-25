import { NextRequest, NextResponse } from "next/server"
import { createBrand } from "@/lib/airtable/brands"
import { brandRegistrationSchema } from "@/lib/validation/brand-schema"

export async function GET() {
  try {
    const response = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Brands`, {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch brands")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching brands:", error)
    return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar datos con Zod
    const validationResult = brandRegistrationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    // Crear registro en Airtable
    const result = await createBrand(validationResult.data)

    return NextResponse.json({
      success: true,
      recordId: result.recordId,
      uploadPhotosLink: result.uploadPhotosLink,
    })
  } catch (error) {
    console.error("Error creating brand:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error al crear el registro",
      },
      { status: 500 }
    )
  }
}
