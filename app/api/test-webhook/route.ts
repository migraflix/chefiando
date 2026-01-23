import { NextRequest, NextResponse } from "next/server";

const WEBHOOK_URL = process.env.PRODUCTOS_WEBHOOK || process.env.PRODUCTS_WEBHOOK_URL;

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Test webhook endpoint llamado");

    if (!WEBHOOK_URL) {
      return NextResponse.json(
        { error: "Webhook URL no configurada" },
        { status: 500 }
      );
    }

    // Obtener parámetros de la request
    const body = await request.json().catch(() => ({}));
    const testType = body.testType || 'simple'; // 'simple', 'gcs', 'base64'

    let testPayload;

    if (testType === 'gcs') {
      console.log("🧪 Probando payload tipo GCS");
      testPayload = {
        test: true,
        testType: 'gcs',
        timestamp: new Date().toISOString(),
        message: "Test webhook con simulación de GCS",
        uploadMethod: 'gcs',
        marca: 'test-brand',
        batch: 1,
        totalBatches: 1,
        products: [{
          recordId: 'test-record-123',
          nombre: 'test-image.jpg',
          contentType: 'image/jpeg',
          gcsPath: 'test_1234567890_abc123_test-image.jpg',
          gcsSignedUrl: 'https://storage.googleapis.com/signed-url-example',
          gcsPublicUrl: 'https://storage.googleapis.com/public-url-example',
          fileSize: 123456,
          base64: undefined, // Debe ser undefined en GCS
          datosProducto: {
            nombre: 'Producto de prueba',
            descripcion: 'Descripción de prueba',
            precio: '10.99',
            tags: ['test', 'gcs']
          }
        }]
      };
    } else if (testType === 'base64') {
      console.log("🧪 Probando payload tipo base64");
      // Base64 pequeño para test
      const smallBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg==';

      testPayload = {
        test: true,
        testType: 'base64',
        timestamp: new Date().toISOString(),
        message: "Test webhook con base64",
        uploadMethod: 'base64',
        marca: 'test-brand',
        batch: 1,
        totalBatches: 1,
        products: [{
          recordId: 'test-record-456',
          nombre: 'test-image-small.jpg',
          contentType: 'image/jpeg',
          base64: smallBase64,
          datosProducto: {
            nombre: 'Producto de prueba base64',
            descripcion: 'Descripción de prueba base64',
            precio: '5.99',
            tags: ['test', 'base64']
          }
        }]
      };
    } else {
      console.log("🧪 Probando payload simple");
      testPayload = {
        test: true,
        testType: 'simple',
        timestamp: new Date().toISOString(),
        message: "Test webhook simple"
      };
    }

    console.log(`📡 Enviando payload de test (${testType}) al webhook: ${WEBHOOK_URL}`);
    console.log(`📏 Tamaño del payload: ${JSON.stringify(testPayload).length} caracteres`);

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    console.log(`📊 Respuesta del webhook: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    console.log("📋 Respuesta completa:", responseText);

    // Análisis adicional de la respuesta
    let responseJson = null;
    try {
      responseJson = JSON.parse(responseText);
      console.log("✅ Respuesta es JSON válido:", responseJson);
    } catch (e) {
      console.log("⚠️ Respuesta no es JSON válido");
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      response: responseText,
      responseJson: responseJson,
      webhookUrl: WEBHOOK_URL.substring(0, 50) + "...",
      testType: testType,
      payloadSize: JSON.stringify(testPayload).length
    });

  } catch (error) {
    console.error("❌ Error en test webhook:", error);
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