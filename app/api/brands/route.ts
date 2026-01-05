import { NextRequest, NextResponse } from "next/server"
import { createBrand } from "@/lib/airtable/brands"
import { brandRegistrationSchema } from "@/lib/validation/brand-schema"

export async function GET() {
  try {
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_API_KEY) {
      console.error("❌ Variables de entorno faltantes:", {
        hasBaseId: !!process.env.AIRTABLE_BASE_ID,
        hasApiKey: !!process.env.AIRTABLE_API_KEY,
      })
      return NextResponse.json(
        { 
          error: "Configuración de Airtable incompleta",
          details: "Faltan AIRTABLE_BASE_ID o AIRTABLE_API_KEY en las variables de entorno"
        },
        { status: 500 }
      )
    }

    // Intentar con diferentes nombres de tabla (por si hay diferencias entre dev y prod)
    const possibleTableNames = [
      "Brands",      // Nombre estándar
      "brands",      // Minúsculas (por si acaso)
      process.env.AIRTABLE_BRANDS_TABLE_ID || "apprcCvYyrWqDXKay", // ID como último recurso
    ]

    let lastError: any = null
    let lastStatus: number = 0

    for (const TABLE_NAME of possibleTableNames) {
      try {
        const encodedTableName = encodeURIComponent(TABLE_NAME)
        const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodedTableName}`

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          return NextResponse.json(data)
        }

        // Si no es exitoso, guardar el error y continuar con el siguiente
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { raw: errorText }
        }

        lastError = errorData
        lastStatus = response.status

        // Si es 404, continuar con el siguiente nombre
        // Si es 403 o 401, también continuar (puede ser que el nombre sea diferente)
        if (response.status === 404) {
          continue // Probar siguiente nombre
        }
        
      } catch (fetchError) {
        lastError = { message: fetchError instanceof Error ? fetchError.message : "Error desconocido" }
        continue // Probar siguiente nombre
      }
    }

    // Si llegamos aquí, ninguna tabla funcionó
    return NextResponse.json(
      {
        error: "Failed to fetch brands",
        details: lastError?.error?.message || lastError?.message || lastError?.raw || `Status: ${lastStatus || 500}`,
        triedTables: possibleTableNames,
        status: lastStatus || 500,
      },
      { status: lastStatus >= 500 ? 500 : lastStatus || 500 }
    )
  } catch (error) {
    console.error("❌ Error fetching brands:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch brands",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

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
