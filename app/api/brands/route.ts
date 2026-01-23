import { NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { z } from "zod"
import { createBrand } from "@/lib/airtable/brands"
import { brandRegistrationSchema, type BrandFormData } from "@/lib/validation/brand-schema"

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
    Sentry.captureException(error, {
      tags: {
        route: '/api/brands',
        method: 'GET',
        component: 'api'
      },
      extra: {
        message: "Error fetching brands from Airtable"
      }
    })
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
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error("Error parsing JSON:", jsonError);
      return NextResponse.json(
        { error: "Datos JSON inválidos" },
        { status: 400 }
      );
    }

    // Asegurar que emprendedor siempre esté presente (incluso si es vacío)
    if (body.emprendedor === undefined || body.emprendedor === null) {
      body.emprendedor = "";
    }

    // Validar datos con Zod (campos requeridos de la sección 1)
    const section1Schema = z.object({
      negocio: brandRegistrationSchema.shape.negocio,
      whatsapp: brandRegistrationSchema.shape.whatsapp,
      emprendedor: brandRegistrationSchema.shape.emprendedor.optional(),
      correo: brandRegistrationSchema.shape.correo.optional(),
      ciudad: brandRegistrationSchema.shape.ciudad.optional(),
      pais: brandRegistrationSchema.shape.pais.optional(),
    })

    const section1Fields = {
      emprendedor: body.emprendedor,
      negocio: body.negocio,
      correo: body.correo,
      ciudad: body.ciudad,
      pais: body.pais,
      whatsapp: body.whatsapp,
    }

    const validationResult = section1Schema.safeParse(section1Fields)

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
    // Type assertion seguro porque el schema ya validó que negocio y whatsapp están presentes
    const result = await createBrand(validationResult.data as BrandFormData, status)

    return NextResponse.json({
      success: true,
      recordId: result.recordId,
      uploadPhotosLink: result.uploadPhotosLink,
    })
  } catch (error) {
    console.error("Error creating brand:", error)
    Sentry.captureException(error, {
      tags: {
        route: '/api/brands',
        method: 'POST',
        component: 'api'
      },
      extra: {
        message: "Error creating brand in Airtable"
      }
    })
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error al crear el registro",
      },
      { status: 500 }
    )
  }
}
