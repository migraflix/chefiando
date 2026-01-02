import { NextRequest, NextResponse } from "next/server"

/**
 * Detecta el país del usuario basado en su IP
 * Retorna el idioma recomendado: "pt" para Brasil, "es" para el resto
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener la IP del usuario
    // En Vercel: x-vercel-forwarded-for o x-forwarded-for
    // En otros servidores: x-forwarded-for, x-real-ip
    // Fallback: request.ip (Next.js)
    const vercelIp = request.headers.get("x-vercel-forwarded-for")
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ip = vercelIp?.split(",")[0]?.trim() || 
               forwardedFor?.split(",")[0]?.trim() || 
               realIp || 
               request.ip || 
               ""

    // Detectar si es IP local
    const isLocalIp = !ip || 
                      ip === "::1" || 
                      ip === "127.0.0.1" || 
                      ip.startsWith("192.168.") || 
                      ip.startsWith("10.") ||
                      ip.startsWith("172.16.") ||
                      ip.startsWith("172.17.") ||
                      ip.startsWith("172.18.") ||
                      ip.startsWith("172.19.") ||
                      ip.startsWith("172.20.") ||
                      ip.startsWith("172.21.") ||
                      ip.startsWith("172.22.") ||
                      ip.startsWith("172.23.") ||
                      ip.startsWith("172.24.") ||
                      ip.startsWith("172.25.") ||
                      ip.startsWith("172.26.") ||
                      ip.startsWith("172.27.") ||
                      ip.startsWith("172.28.") ||
                      ip.startsWith("172.29.") ||
                      ip.startsWith("172.30.") ||
                      ip.startsWith("172.31.")

    if (isLocalIp) {
      // IP local, usar español por defecto
      return NextResponse.json({ 
        language: "es", 
        country: "Local", 
        method: "local-ip",
        ip: ip || "unknown"
      })
    }

    // Usar una API gratuita de geolocalización por IP
    // Opción 1: ip-api.com (gratis, sin API key, hasta 45 req/min)
    try {
      const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode`, {
        headers: {
          "User-Agent": "Migraflix/1.0",
        },
      })

      if (geoResponse.ok) {
        const geoData = await geoResponse.json()
        
        if (geoData.status === "success") {
          const country = geoData.country || ""
          const countryCode = geoData.countryCode || ""
          
          // Solo Brasil es portugués, todo lo demás español
          const language = countryCode === "BR" || country.toLowerCase().includes("brazil") ? "pt" : "es"
          
          return NextResponse.json({
            language,
            country,
            countryCode,
            method: "ip-api",
          })
        }
      }
    } catch (error) {
      console.error("Error con ip-api.com:", error)
    }

    // Fallback: usar español por defecto
    return NextResponse.json({ language: "es", country: "Unknown", method: "fallback" })
  } catch (error) {
    console.error("Error detecting language:", error)
    // En caso de error, retornar español por defecto
    return NextResponse.json({ language: "es", country: "Unknown", method: "error" })
  }
}

