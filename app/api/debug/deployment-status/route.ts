import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Verificar que los endpoints existen y funcionan
    const endpoints = [
      '/api/content/image/',
      '/api/webhook/upload-generated-image',
      '/api/webhook/create-content-record',
      '/api/debug/content-images'
    ];

    const checks = await Promise.all(
      endpoints.map(async (endpoint) => {
        try {
          // Solo verificar que el endpoint existe (no ejecutar)
          const response = await fetch(`http://localhost:3000${endpoint}`, {
            method: 'HEAD'
          });
          return { endpoint, status: response.status };
        } catch {
          return { endpoint, status: 'not-deployed' };
        }
      })
    );

    return NextResponse.json({
      success: true,
      deploymentStatus: 'checked',
      checks,
      message: 'Estado de deployment verificado',
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error checking deployment status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}