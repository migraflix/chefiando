import { NextRequest, NextResponse } from "next/server";
import { gcsService } from "@/lib/gcs-service";
import * as Sentry from "@sentry/nextjs";

/**
 * API endpoint para limpiar archivos temporales antiguos en GCS
 * Debe ser llamado periódicamente (ej: cada 24 horas)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar si GCS está habilitado
    if (process.env.TEST_UPLOAD !== 'true') {
      return NextResponse.json(
        {
          error: "GCS is not enabled",
          message: "Set TEST_UPLOAD=true to enable Google Cloud Storage cleanup"
        },
        { status: 400 }
      );
    }

    // Verificar autenticación básica (puedes cambiar por JWT o API key)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CLEANUP_API_TOKEN || 'migraflix-cleanup-2024';

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer "
    if (token !== expectedToken) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    console.log('🧹 Iniciando limpieza automática de archivos GCS...');

    // Ejecutar limpieza
    const deletedCount = await gcsService.cleanupOldTempFiles();

    console.log(`✅ Limpieza completada. ${deletedCount} archivos eliminados.`);

    // Enviar evento a Sentry para monitoreo
    Sentry.captureMessage(`GCS cleanup completed: ${deletedCount} files deleted`, {
      level: 'info',
      tags: {
        component: 'maintenance',
        operation: 'gcs_cleanup',
      },
      extra: {
        deletedFilesCount: deletedCount,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Cleanup completed successfully`,
      deletedFilesCount: deletedCount,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error en limpieza GCS:', error);

    // Enviar error a Sentry
    Sentry.captureException(error, {
      tags: {
        component: 'maintenance',
        operation: 'gcs_cleanup_error',
      },
    });

    return NextResponse.json(
      {
        error: "Error during GCS cleanup",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint para verificar el estado de GCS (útil para health checks)
 */
export async function GET() {
  try {
    // Verificar si GCS está habilitado
    if (process.env.TEST_UPLOAD !== 'true') {
      return NextResponse.json({
        status: 'disabled',
        message: 'GCS is not enabled. Set TEST_UPLOAD=true to enable Google Cloud Storage.',
        gcsConfigured: false,
        timestamp: new Date().toISOString(),
      });
    }

    // Verificar que GCS esté configurado y funcionando
    const tempFiles = await gcsService.listFiles('temp/');
    const allFiles = await gcsService.listFiles(''); // Todos los archivos en root

    return NextResponse.json({
      status: 'healthy',
      gcsConfigured: true,
      tempFilesCount: tempFiles.length,
      allFilesCount: allFiles.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error verificando estado GCS:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'GCS configuration or connection error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}