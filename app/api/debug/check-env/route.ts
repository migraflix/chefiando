import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.AIRTABLE_API_KEY || ""
    const baseId = process.env.AIRTABLE_BASE_ID || ""

    // Análisis detallado de las variables
    const analysis = {
      apiKey: {
        exists: !!apiKey,
        length: apiKey.length,
        startsWith: apiKey.substring(0, 10),
        endsWith: apiKey.substring(apiKey.length - 5),
        hasSpaces: apiKey.includes(" "),
        hasNewlines: apiKey.includes("\n") || apiKey.includes("\r"),
        hasTabs: apiKey.includes("\t"),
        trimmedLength: apiKey.trim().length,
        firstChar: apiKey.charAt(0),
        lastChar: apiKey.charAt(apiKey.length - 1),
        // Verificar formato típico de Airtable API Key (empieza con "pat" o "key")
        expectedFormat: apiKey.startsWith("pat") || apiKey.startsWith("key") ? "✅ Formato correcto" : "⚠️ Formato inusual",
      },
      baseId: {
        exists: !!baseId,
        length: baseId.length,
        startsWith: baseId.substring(0, 5),
        endsWith: baseId.substring(baseId.length - 5),
        hasSpaces: baseId.includes(" "),
        hasNewlines: baseId.includes("\n") || baseId.includes("\r"),
        hasTabs: baseId.includes("\t"),
        trimmedLength: baseId.trim().length,
        firstChar: baseId.charAt(0),
        lastChar: baseId.charAt(baseId.length - 1),
        // Base ID típicamente tiene 17 caracteres y empieza con "app"
        expectedFormat: baseId.startsWith("app") && baseId.length === 17 ? "✅ Formato correcto" : "⚠️ Formato inusual",
      },
      recommendations: [] as string[],
    }

    // Recomendaciones
    if (analysis.apiKey.hasSpaces || analysis.apiKey.hasNewlines || analysis.apiKey.hasTabs) {
      analysis.recommendations.push("⚠️ El API Key tiene espacios, saltos de línea o tabs. Debe estar en una sola línea sin espacios.")
    }

    if (analysis.apiKey.length !== analysis.apiKey.trimmedLength) {
      analysis.recommendations.push("⚠️ El API Key tiene espacios al inicio o final. Elimínalos.")
    }

    if (analysis.baseId.hasSpaces || analysis.baseId.hasNewlines || analysis.baseId.hasTabs) {
      analysis.recommendations.push("⚠️ El Base ID tiene espacios, saltos de línea o tabs. Debe estar en una sola línea sin espacios.")
    }

    if (analysis.baseId.length !== analysis.baseId.trimmedLength) {
      analysis.recommendations.push("⚠️ El Base ID tiene espacios al inicio o final. Elimínalos.")
    }

    if (!apiKey.startsWith("pat") && !apiKey.startsWith("key")) {
      analysis.recommendations.push("⚠️ El API Key no tiene el formato esperado (debería empezar con 'pat' o 'key')")
    }

    if (!baseId.startsWith("app") || baseId.length !== 17) {
      analysis.recommendations.push("⚠️ El Base ID no tiene el formato esperado (debería empezar con 'app' y tener 17 caracteres)")
    }

    if (analysis.recommendations.length === 0) {
      analysis.recommendations.push("✅ El formato de las variables parece correcto. El problema puede ser de permisos en Airtable.")
      analysis.recommendations.push("💡 Verifica en Airtable que el API Key tenga acceso a esta base específica.")
      analysis.recommendations.push("💡 Asegúrate de que el API Key no tenga restricciones de IP o dominio.")
    }

    return NextResponse.json({
      analysis,
      // Mostrar valores parciales para verificación (sin exponer todo)
      preview: {
        apiKey: apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : "No configurado",
        baseId: baseId ? `${baseId.substring(0, 6)}...${baseId.substring(baseId.length - 4)}` : "No configurado",
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


