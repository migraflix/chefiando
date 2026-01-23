import { NextRequest, NextResponse } from "next/server";
import { gcsService } from "@/lib/gcs-service";

const WEBHOOK_URL = process.env.PRODUCTOS_WEBHOOK || process.env.PRODUCTS_WEBHOOK_URL;

/**
 * Valida un payload de webhook antes de enviarlo
 */
function validateWebhookPayload(payload: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!payload.marca) {
    errors.push('Falta marca');
  }

  if (!payload.batch || !payload.totalBatches) {
    errors.push('Faltan batch/totalBatches');
  }

  if (!payload.products || !Array.isArray(payload.products) || payload.products.length === 0) {
    errors.push('Faltan productos o el array está vacío');
  }

  const product = payload.products[0];

  if (!product.recordId) {
    errors.push('Producto sin recordId');
  }

  if (!product.nombre) {
    errors.push('Producto sin nombre');
  }

  if (!product.contentType) {
    errors.push('Producto sin contentType');
  }

  if (!product.datosProducto) {
    errors.push('Producto sin datosProducto');
  }

  // Validación específica por método
  if (payload.uploadMethod === 'gcs') {
    if (!product.gcsPath) {
      errors.push('Método GCS pero falta gcsPath');
    }
    if (!product.gcsSignedUrl) {
      errors.push('Método GCS pero falta gcsSignedUrl');
    }
    if (product.base64) {
      errors.push(`Método GCS pero base64 presente (${product.base64.length} chars)`);
    }
  } else if (payload.uploadMethod === 'base64') {
    if (!product.base64 || product.base64.length === 0) {
      errors.push('Método base64 pero falta base64 data');
    }
  } else {
    errors.push(`Método de subida desconocido: ${payload.uploadMethod}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Test GCS + Webhook endpoint llamado");

    if (!WEBHOOK_URL) {
      return NextResponse.json(
        { error: "Webhook URL no configurada" },
        { status: 500 }
      );
    }

    if (process.env.TEST_UPLOAD !== 'true') {
      return NextResponse.json(
        { error: "TEST_UPLOAD debe ser 'true' para probar GCS" },
        { status: 400 }
      );
    }

    // Crear una imagen base64 pequeña para test
    const smallBase64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg==';

    console.log("📤 Subiendo imagen de test a GCS...");

    // Subir a GCS
    const gcsResult = await gcsService.uploadFromBase64(
      smallBase64Image,
      'test-gcs-webhook.jpg',
      'image/jpeg',
      {
        prefix: 'test-',
        metadata: {
          test: true,
          source: 'test-gcs-webhook',
          timestamp: new Date().toISOString()
        }
      }
    );

    console.log("✅ Imagen subida a GCS:", gcsResult.gcsPath);

    // Preparar payload para webhook (simulando el formato real)
    const webhookPayload = {
      test: true,
      testType: 'gcs-webhook-integration',
      timestamp: new Date().toISOString(),
      message: "Test integración GCS + Webhook",
      uploadMethod: 'gcs',
      marca: 'test-brand-gcs',
      batch: 1,
      totalBatches: 1,
      products: [{
        recordId: 'test-gcs-record-123',
        nombre: 'test-gcs-webhook.jpg',
        contentType: 'image/jpeg',
        gcsPath: gcsResult.gcsPath,
        gcsSignedUrl: gcsResult.signedUrl,
        gcsPublicUrl: gcsResult.publicUrl,
        fileSize: gcsResult.size,
        base64: undefined, // Debe ser undefined en GCS
        datosProducto: {
          nombre: 'Producto test GCS-Webhook',
          descripcion: 'Test de integración entre GCS y webhook',
          precio: '9.99',
          tags: ['test', 'gcs', 'webhook']
        }
      }]
    };

    // Validar payload antes de enviar
    const validation = validateWebhookPayload(webhookPayload);
    if (!validation.valid) {
      console.error('❌ Payload inválido:', validation.errors);
      return NextResponse.json(
        { error: `Payload validation failed: ${validation.errors.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`📡 Enviando payload GCS al webhook...`);
    console.log(`📏 Tamaño del payload: ${JSON.stringify(webhookPayload).length} caracteres`);

    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    console.log(`📊 Respuesta del webhook: ${webhookResponse.status} ${webhookResponse.statusText}`);

    const webhookResponseText = await webhookResponse.text();
    console.log("📋 Respuesta completa del webhook:", webhookResponseText);

    return NextResponse.json({
      success: webhookResponse.ok,
      gcsUpload: {
        success: true,
        gcsPath: gcsResult.gcsPath,
        signedUrl: gcsResult.signedUrl,
        size: gcsResult.size
      },
      webhook: {
        status: webhookResponse.status,
        statusText: webhookResponse.statusText,
        response: webhookResponseText,
        payloadSize: JSON.stringify(webhookPayload).length
      },
      webhookUrl: WEBHOOK_URL.substring(0, 50) + "..."
    });

  } catch (error) {
    console.error("❌ Error en test GCS + Webhook:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}