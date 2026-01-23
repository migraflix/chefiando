import { NextResponse } from "next/server";
import { GCS_CONFIG } from "@/lib/config";

export async function GET() {
  try {
    const gcsStatus = {
      config: {
        enabled: GCS_CONFIG.enabled,
        projectId: GCS_CONFIG.projectId,
        bucketName: GCS_CONFIG.bucketName,
        testUpload: process.env.TEST_UPLOAD,
        hasCredentialsFile: !!GCS_CONFIG.keyFilename,
        hasCredentialsJson: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
        signedUrlExpiry: GCS_CONFIG.signedUrlExpiry,
        tempPrefix: GCS_CONFIG.tempPrefix,
        cleanupAfterHours: GCS_CONFIG.cleanupAfterHours,
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        isProduction: process.env.NODE_ENV === 'production',
        isVercel: !!process.env.VERCEL,
        vercelEnv: process.env.VERCEL_ENV,
      },
      recommendations: [] as string[],
      issues: [] as string[],
    };

    // Verificar problemas comunes
    if (!GCS_CONFIG.enabled) {
      gcsStatus.issues.push("❌ GCS está DESHABILITADO (TEST_UPLOAD != 'true')");
      gcsStatus.recommendations.push("🔧 Configura TEST_UPLOAD=true en las variables de entorno de producción");
    }

    if (!gcsStatus.config.hasCredentialsFile && !gcsStatus.config.hasCredentialsJson) {
      gcsStatus.issues.push("❌ No hay credenciales de GCS configuradas");
      gcsStatus.recommendations.push("🔧 Configura GOOGLE_APPLICATION_CREDENTIALS_JSON con las credenciales del service account");
    }

    if (gcsStatus.issues.length === 0) {
      gcsStatus.recommendations.push("✅ Configuración de GCS parece correcta");
      gcsStatus.recommendations.push("💡 Si aún hay errores, verifica permisos del service account en GCS");
      gcsStatus.recommendations.push("💡 Asegúrate de que el bucket existe y es accesible");
    }

    // Intentar inicializar GCS para verificar conectividad
    let connectionTest = { success: false, error: null as string | null };
    try {
      if (GCS_CONFIG.enabled) {
        const { getGCSClient } = await import('@/lib/config');
        const client = getGCSClient();
        // Intentar listar buckets para verificar conexión
        await client.getBuckets({ maxResults: 1 });
        connectionTest.success = true;
      }
    } catch (error) {
      connectionTest.success = false;
      connectionTest.error = error instanceof Error ? error.message : 'Error desconocido';
      gcsStatus.issues.push(`❌ Error de conexión GCS: ${connectionTest.error}`);
    }

    return NextResponse.json({
      success: true,
      gcsStatus,
      connectionTest,
      message: "Estado de GCS verificado"
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}