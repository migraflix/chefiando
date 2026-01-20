import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

interface UploadTestResult {
  timestamp: string;
  userAgent: string;
  ip: string;
  marca: string;
  productsCount: number;
  photosCount: number;
  totalSize: number;
  contentTypes: string[];
  validationPassed: boolean;
  airtableTest: boolean;
  webhookTest: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Ruta de debug para testing de upload de fotos
 * Ayuda a identificar por qué algunos usuarios no pueden subir fotos
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const result: UploadTestResult = {
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get('user-agent') || 'unknown',
    ip: request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        request.ip ||
        'unknown',
    marca: '',
    productsCount: 0,
    photosCount: 0,
    totalSize: 0,
    contentTypes: [],
    validationPassed: false,
    airtableTest: false,
    webhookTest: false,
    errors: [],
    warnings: []
  };

  try {
    // Obtener IP del usuario para logging
    const vercelIp = request.headers.get("x-vercel-forwarded-for");
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = vercelIp?.split(",")[0]?.trim() ||
               forwardedFor?.split(",")[0]?.trim() ||
               realIp ||
               request.ip ||
               "";

    console.log(`🧪 Upload Test iniciado desde IP: ${ip}, User-Agent: ${result.userAgent}`);

    // Parsear FormData
    const formData = await request.formData();

    // Extraer datos básicos
    result.marca = formData.get("marca") as string || '';
    const productsJson = formData.get("products") as string || '';

    console.log(`📋 Datos básicos: marca=${result.marca}, productsJson length=${productsJson.length}`);

    // Verificar configuración de Airtable
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const PHOTOS_TABLE_NAME = "Fotos AI";
    const WEBHOOK_URL = process.env.PRODUCTOS_WEBHOOK || process.env.PRODUCTS_WEBHOOK_URL;

    if (!AIRTABLE_API_KEY) {
      result.errors.push("AIRTABLE_API_KEY no configurada");
    }
    if (!AIRTABLE_BASE_ID) {
      result.errors.push("AIRTABLE_BASE_ID no configurada");
    }
    if (!WEBHOOK_URL) {
      result.errors.push("PRODUCTOS_WEBHOOK/PRODUCTS_WEBHOOK_URL no configurada");
    }

    // Validar productos JSON
    let products = [];
    try {
      products = JSON.parse(productsJson);
      result.productsCount = products.length;
      console.log(`📦 Productos parseados: ${result.productsCount}`);
    } catch (parseError) {
      result.errors.push(`Error parseando JSON de productos: ${parseError instanceof Error ? parseError.message : 'Error desconocido'}`);
      console.error("❌ Error parseando productos:", parseError);
    }

    // Contar y validar fotos
    const photoFiles: File[] = [];
    for (let i = 0; i < products.length; i++) {
      const photoKey = `photo_${i}`;
      const photoFile = formData.get(photoKey) as File;

      if (photoFile) {
        photoFiles.push(photoFile);
        result.photosCount++;
        result.totalSize += photoFile.size;
        result.contentTypes.push(photoFile.type);

        // Validar tamaño (5MB máximo)
        if (photoFile.size > 5 * 1024 * 1024) {
          result.warnings.push(`Foto ${i} demasiado grande: ${Math.round(photoFile.size / 1024 / 1024)}MB`);
        }

        // Validar tipo
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(photoFile.type)) {
          result.errors.push(`Tipo de archivo no válido para foto ${i}: ${photoFile.type}`);
        }
      } else {
        result.warnings.push(`Foto faltante para producto ${i}`);
      }
    }

    console.log(`📸 Fotos encontradas: ${result.photosCount}, Tamaño total: ${Math.round(result.totalSize / 1024)}KB`);

    // Test de conexión con Airtable
    if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
      try {
        const encodedTableName = encodeURIComponent(PHOTOS_TABLE_NAME);
        const testUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodedTableName}`;

        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          },
        });

        if (response.ok) {
          result.airtableTest = true;
          console.log("✅ Conexión con Airtable OK");
        } else {
          result.errors.push(`Error de conexión con Airtable: ${response.status} ${response.statusText}`);
          console.error("❌ Error de conexión con Airtable:", response.status, response.statusText);
        }
      } catch (airtableError) {
        result.errors.push(`Error de red con Airtable: ${airtableError instanceof Error ? airtableError.message : 'Error desconocido'}`);
        console.error("❌ Error de red con Airtable:", airtableError);
      }
    }

    // Test de webhook (solo HEAD request para verificar conectividad)
    if (WEBHOOK_URL) {
      try {
        const webhookResponse = await fetch(WEBHOOK_URL, {
          method: 'HEAD',
        });

        if (webhookResponse.ok || webhookResponse.status === 405) { // 405 es OK, significa que el endpoint existe
          result.webhookTest = true;
          console.log("✅ Webhook reachable");
        } else {
          result.warnings.push(`Webhook respondió con status: ${webhookResponse.status}`);
          console.warn("⚠️ Webhook status:", webhookResponse.status);
        }
      } catch (webhookError) {
        result.errors.push(`Error conectando con webhook: ${webhookError instanceof Error ? webhookError.message : 'Error desconocido'}`);
        console.error("❌ Error de webhook:", webhookError);
      }
    }

    // Validación final
    result.validationPassed = result.errors.length === 0 && result.productsCount > 0 && result.photosCount > 0;

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`🧪 Upload Test completado en ${duration}ms. Errores: ${result.errors.length}, Warnings: ${result.warnings.length}`);

    // Enviar resultado a Sentry si hay errores
    if (result.errors.length > 0) {
      Sentry.captureMessage(`Upload Test Failed for user from ${ip}`, {
        level: 'warning',
        tags: {
          route: '/api/debug/upload-test',
          method: 'POST',
          component: 'debug',
          hasErrors: result.errors.length > 0,
          hasWarnings: result.warnings.length > 0,
        },
        extra: {
          result,
          duration,
          ip,
          userAgent: result.userAgent,
        }
      });
    }

    return NextResponse.json({
      success: result.validationPassed,
      result,
      duration,
      message: result.validationPassed
        ? "✅ Upload test passed - Todo debería funcionar correctamente"
        : "❌ Upload test failed - Revisar errores y warnings",
    });

  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error("❌ Error fatal en upload test:", error);
    result.errors.push(`Error fatal: ${error instanceof Error ? error.message : 'Error desconocido'}`);

    Sentry.captureException(error, {
      tags: {
        route: '/api/debug/upload-test',
        method: 'POST',
        component: 'debug',
        errorType: 'FATAL_ERROR'
      },
      extra: {
        result,
        duration,
        userAgent: result.userAgent,
        ip: result.ip,
      }
    });

    return NextResponse.json(
      {
        success: false,
        result,
        duration,
        error: error instanceof Error ? error.message : "Error fatal en test de upload",
      },
      { status: 500 }
    );
  }
}