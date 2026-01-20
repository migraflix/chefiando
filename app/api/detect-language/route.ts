import { NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"

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
      // IP local - en desarrollo, intentar obtener IP pública usando un servicio externo
      try {
        // Intentar obtener IP pública desde un servicio externo
        const publicIpResponse = await fetch("https://api.ipify.org?format=json", {
          headers: {
            "User-Agent": "Migraflix/1.0",
          },
        })
        
        if (publicIpResponse.ok) {
          const publicIpData = await publicIpResponse.json()
          const publicIp = publicIpData.ip
          
          // Ahora usar la IP pública para geolocalización
          const geoResponse = await fetch(`http://ip-api.com/json/${publicIp}?fields=status,message,country,countryCode`, {
            headers: {
              "User-Agent": "Migraflix/1.0",
            },
          })

          if (geoResponse.ok) {
            const geoData = await geoResponse.json()
            
            if (geoData.status === "success") {
              const country = geoData.country || ""
              const countryCode = geoData.countryCode || ""
              const language = countryCode === "BR" || country.toLowerCase().includes("brazil") ? "pt" : "es"
              
              return NextResponse.json({
                language,
                country,
                countryCode,
                ip: publicIp,
                localIp: ip,
                method: "ip-api-public",
                flag: countryCode === "BR" ? "🇧🇷" : "🇲🇽",
              })
            }
          }
        }
      } catch (error) {
        console.error("Error obteniendo IP pública:", error)
      }
      
      // Si no se pudo obtener IP pública, usar español por defecto
      return NextResponse.json({ 
        language: "es", 
        country: "Local (Desarrollo)", 
        countryCode: "MX",
        method: "local-ip",
        ip: ip || "localhost",
        flag: "🇲🇽",
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
            ip,
            method: "ip-api",
            flag: countryCode === "BR" ? "🇧🇷" : "🇲🇽", // Bandera de Brasil o México
          })
        }
      }
    } catch (error) {
      console.error("Error con ip-api.com:", error)
    }

    // Fallback: usar español por defecto
    return NextResponse.json({ 
      language: "es", 
      country: "Unknown", 
      countryCode: "MX",
      ip: ip || "unknown",
      method: "fallback",
      flag: "🇲🇽",
    })
  } catch (error) {
    console.error("Error detecting language:", error)
    Sentry.captureException(error, {
      tags: {
        route: '/api/detect-language',
        method: 'GET',
        component: 'api'
      },
      extra: {
        message: "Error detecting user language based on IP"
      }
    })
    // En caso de error, retornar español por defecto
    return NextResponse.json({
      language: "es",
      country: "Unknown",
      countryCode: "MX",
      ip: "error",
      method: "error",
      flag: "🇲🇽",
    })
  }
}

