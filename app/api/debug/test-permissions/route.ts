import { NextResponse } from "next/server"

/**
 * Prueba específica de permisos con diferentes métodos
 */
export async function GET() {
  try {
    const apiKey = process.env.AIRTABLE_API_KEY || ""
    const baseId = process.env.AIRTABLE_BASE_ID || ""

    if (!apiKey || !baseId) {
      return NextResponse.json({
        error: "Variables de entorno no configuradas",
      }, { status: 400 })
    }

    const tests = []

    // Test 1: Verificar el token (obtener información del usuario)
    try {
      const userResponse = await fetch("https://api.airtable.com/v0/meta/whoami", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      tests.push({
        name: "Verificar Token (WhoAmI)",
        success: userResponse.ok,
        status: userResponse.status,
        data: userResponse.ok ? await userResponse.json() : await userResponse.text(),
      })
    } catch (error) {
      tests.push({
        name: "Verificar Token (WhoAmI)",
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      })
    }

    // Test 2: Listar bases accesibles
    try {
      const basesResponse = await fetch("https://api.airtable.com/v0/meta/bases", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      tests.push({
        name: "Listar Bases",
        success: basesResponse.ok,
        status: basesResponse.status,
        data: basesResponse.ok ? await basesResponse.json() : await basesResponse.text(),
      })
    } catch (error) {
      tests.push({
        name: "Listar Bases",
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      })
    }

    // Test 3: Acceder a la base específica
    try {
      const baseResponse = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      tests.push({
        name: `Acceder a Base ${baseId.substring(0, 6)}...`,
        success: baseResponse.ok,
        status: baseResponse.status,
        data: baseResponse.ok ? await baseResponse.json() : await baseResponse.text(),
      })
    } catch (error) {
      tests.push({
        name: `Acceder a Base ${baseId.substring(0, 6)}...`,
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      })
    }

    // Test 4: Listar tablas de la base
    try {
      const tablesResponse = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      tests.push({
        name: "Listar Tablas de la Base",
        success: tablesResponse.ok,
        status: tablesResponse.status,
        data: tablesResponse.ok ? await tablesResponse.json() : await tablesResponse.text(),
      })
    } catch (error) {
      tests.push({
        name: "Listar Tablas de la Base",
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      })
    }

    return NextResponse.json({
      tests,
      summary: {
        total: tests.length,
        successful: tests.filter((t) => t.success).length,
        failed: tests.filter((t) => !t.success).length,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}


