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

    // Log para debug
    console.log("📥 Recibiendo datos en API:", {
      emprendedor: body.emprendedor,
      tipo: typeof body.emprendedor,
      todosLosDatos: body
    });

    // Asegurar que emprendedor siempre esté presente (incluso si es vacío)
    if (body.emprendedor === undefined || body.emprendedor === null) {
      body.emprendedor = "";
    }

    // Validar datos con Zod (solo los campos de la sección 1)
    const section1Fields = {
      emprendedor: body.emprendedor,
      negocio: body.negocio,
      correo: body.correo,
      ciudad: body.ciudad,
      pais: body.pais,
      whatsapp: body.whatsapp,
    }

    const validationResult = brandRegistrationSchema.partial().safeParse(section1Fields)
    
    console.log("✅ Validación Zod:", {
      success: validationResult.success,
      emprendedorEnValidado: validationResult.success ? validationResult.data.emprendedor : "error"
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    // Crear registro en Airtable con Status "Basic Register"
    const status = body.status || "Basic Register"
    const result = await createBrand(validationResult.data, status)

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
