import { NextRequest, NextResponse } from "next/server";
import { gcsService } from "@/lib/gcs-service";

export async function GET() {
  try {
    console.log('🧪 Probando GCS desde el servidor...');

    // Verificar configuración
    console.log('TEST_UPLOAD:', process.env.TEST_UPLOAD);
    console.log('GCP_PROJECT_ID:', process.env.GCP_PROJECT_ID);
    console.log('GCS_BUCKET_NAME:', process.env.GCS_BUCKET_NAME);

    // Verificar si GCS está habilitado
    if (process.env.TEST_UPLOAD !== 'true') {
      return NextResponse.json({
        success: false,
        message: 'GCS is not enabled. Set TEST_UPLOAD=true to test Google Cloud Storage.',
        testUpload: process.env.TEST_UPLOAD
      });
    }

    // Verificar que podemos acceder al bucket
    const bucket = await gcsService.getFileMetadata('test.txt').catch(() => null);

    // Intentar listar archivos (máximo 1)
    try {
      const files = await gcsService.listFiles();
      console.log(`📁 Bucket tiene ${files.length} archivos`);

      return NextResponse.json({
        success: true,
        message: 'GCS funciona correctamente desde el servidor',
        bucketName: process.env.GCS_BUCKET_NAME,
        fileCount: files.length,
        testUpload: process.env.TEST_UPLOAD
      });
    } catch (listError) {
      console.log('⚠️ No se pudieron listar archivos:', listError.message);

      return NextResponse.json({
        success: false,
        message: 'GCS inicializado pero no puede listar archivos',
        error: listError.message
      });
    }

  } catch (error) {
    console.error('❌ Error probando GCS:', error);

    return NextResponse.json({
      success: false,
      message: 'Error conectando con GCS',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}