import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET() {
  try {
    // Agregar contexto
    Sentry.setContext("test_error", {
      endpoint: "/api/test-error",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "production",
    });

    // Generar un error de prueba
    throw new Error("Test error desde API en producción - " + new Date().toISOString());
  } catch (error) {
    // Capturar el error en Sentry
    Sentry.captureException(error);

    // Retornar respuesta (el error ya fue capturado)
    return NextResponse.json(
      {
        success: true,
        message: "Error de prueba generado y enviado a Sentry",
        error: error instanceof Error ? error.message : "Error desconocido",
        timestamp: new Date().toISOString(),
        sentry: "Error capturado en Sentry",
      },
      { status: 200 }
    );
  }
}

