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

    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      message: "Test webhook desde endpoint de prueba"
    };

    console.log("📡 Enviando payload de test al webhook:", WEBHOOK_URL);

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

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      response: responseText,
      webhookUrl: WEBHOOK_URL.substring(0, 50) + "..."
    });

  } catch (error) {
    console.error("❌ Error en test webhook:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}