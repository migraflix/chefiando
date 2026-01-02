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

    // Usar ID de tabla para mayor confiabilidad
    const TABLE_ID = process.env.AIRTABLE_BRANDS_TABLE_ID || "apprcCvYyrWqDXKay"
    const encodedTableName = encodeURIComponent(TABLE_ID)
    const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodedTableName}`
    
    console.log("🔍 [BRANDS API] Iniciando fetch:", {
      baseId: process.env.AIRTABLE_BASE_ID?.substring(0, 10) + "...",
      tableId: TABLE_ID,
      encodedTableName,
      url: url.replace(process.env.AIRTABLE_BASE_ID!, "[BASE_ID]"),
      apiKeyLength: process.env.AIRTABLE_API_KEY?.length || 0,
      timestamp: new Date().toISOString(),
    })

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { raw: errorText }
      }
      
      console.error("❌ [BRANDS API] Error de Airtable:", {
        status: response.status,
        statusText: response.statusText,
        statusCode: response.status,
        error: errorData,
        url: url.replace(process.env.AIRTABLE_BASE_ID!, "[BASE_ID]"),
        headers: {
          hasAuth: !!response.headers.get("authorization"),
          contentType: response.headers.get("content-type"),
        },
        timestamp: new Date().toISOString(),
      })
      
      // Logs adicionales según el tipo de error
      if (response.status === 401) {
        console.error("🔐 [BRANDS API] Error 401: API Key inválida o expirada")
      } else if (response.status === 403) {
        console.error("🚫 [BRANDS API] Error 403: Sin permisos para acceder a esta base")
      } else if (response.status === 404) {
        console.error("🔍 [BRANDS API] Error 404: Base ID o tabla no encontrada")
      }
      
      return NextResponse.json(
        {
          error: "Failed to fetch brands",
          details: errorData.error?.message || errorData.raw || `Status: ${response.status}`,
          status: response.status,
        },
        { status: response.status >= 500 ? 500 : response.status }
      )
    }

    const data = await response.json()
    console.log("✅ [BRANDS API] Brands fetched successfully:", {
      recordsCount: data.records?.length || 0,
      hasRecords: !!(data.records && data.records.length > 0),
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(data)
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
