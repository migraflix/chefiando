import { NextResponse } from "next/server"

export async function GET() {
  try {
    const results: any = {
      env: {
        hasApiKey: !!process.env.AIRTABLE_API_KEY,
        hasBaseId: !!process.env.AIRTABLE_BASE_ID,
        apiKeyLength: process.env.AIRTABLE_API_KEY?.length || 0,
        baseIdLength: process.env.AIRTABLE_BASE_ID?.length || 0,
      },
      server: {
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        arch: process.arch,
      },
      connection: {
        success: false,
        status: null as number | null,
        error: null as any,
        recordsCount: null as number | null,
        url: null as string | null,
        workingTableName: null as string | null,
      },
      baseAccess: {
        success: false,
        status: null as number | null,
        error: null as any,
        tables: null as any,
      },
      tableTests: [] as any[],
    }

    // Si faltan variables, no intentar conexión
    if (!results.env.hasApiKey || !results.env.hasBaseId) {
      return NextResponse.json(results)
    }

    // Intentar conexión a Airtable
    try {
      // Primero, probar acceso a la base (sin tabla específica)
      const baseUrl = `https://api.airtable.com/v0/meta/bases/${process.env.AIRTABLE_BASE_ID}/tables`
      results.baseAccess = {
        success: false,
        status: null as number | null,
        error: null as any,
        tables: null as any,
      }

      try {
        const baseResponse = await fetch(baseUrl, {
          headers: {
            Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          },
        })

        results.baseAccess.status = baseResponse.status

        if (baseResponse.ok) {
          const baseData = await baseResponse.json()
          results.baseAccess.success = true
          results.baseAccess.tables = baseData.tables?.map((t: any) => ({
            id: t.id,
            name: t.name,
            primaryFieldId: t.primaryFieldId,
          })) || []
        } else {
          const errorText = await baseResponse.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { raw: errorText }
          }
          results.baseAccess.error = errorData
        }
      } catch (baseError) {
        results.baseAccess.error = {
          message: baseError instanceof Error ? baseError.message : "Error desconocido",
        }
      }

      // Ahora probar acceso a la tabla "Brands" usando ID y nombres
      const BRANDS_TABLE_ID = process.env.AIRTABLE_BRANDS_TABLE_ID || "apprcCvYyrWqDXKay"
      const possibleTableNames = [BRANDS_TABLE_ID, "Brands", "brands", "Brand", "brand", "Marcas", "marcas"]
      results.tableTests = []

      for (const tableName of possibleTableNames) {
        const encodedTableName = encodeURIComponent(tableName)
        const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodedTableName}?maxRecords=1`
        
        try {
          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
            },
          })

          const testResult: any = {
            tableName,
            encodedTableName,
            status: response.status,
            success: response.ok,
            error: null,
            recordsCount: null,
          }

          if (response.ok) {
            const data = await response.json()
            testResult.recordsCount = data.records?.length || 0
            results.connection.success = true
            results.connection.status = response.status
            results.connection.recordsCount = testResult.recordsCount
            results.connection.url = url.replace(process.env.AIRTABLE_BASE_ID!, "[BASE_ID]")
            results.connection.workingTableName = tableName
          } else {
            const errorText = await response.text()
            let errorData
            try {
              errorData = JSON.parse(errorText)
            } catch {
              errorData = { raw: errorText }
            }
            testResult.error = errorData
          }

          results.tableTests.push(testResult)
        } catch (error) {
          results.tableTests.push({
            tableName,
            encodedTableName,
            success: false,
            error: {
              message: error instanceof Error ? error.message : "Error desconocido",
            },
          })
        }
      }

      // Si ninguna tabla funcionó, usar el primer error como referencia
      if (!results.connection.success && results.tableTests.length > 0) {
        const firstError = results.tableTests.find((t: any) => t.error)
        if (firstError) {
          results.connection.error = firstError.error
          results.connection.status = firstError.status
        }
      }
    } catch (error) {
      results.connection.error = {
        message: error instanceof Error ? error.message : "Error desconocido",
        type: error instanceof Error ? error.constructor.name : typeof error,
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}

