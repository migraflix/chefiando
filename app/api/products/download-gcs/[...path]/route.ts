import { NextRequest, NextResponse } from "next/server";
import { gcsService } from "@/lib/gcs-service";

/**
 * API endpoint para descargar archivos desde Google Cloud Storage
 * URL: /api/products/download-gcs/[gcsPath]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Verificar si GCS está habilitado
    if (process.env.TEST_UPLOAD !== 'true') {
      return NextResponse.json(
        {
          error: "GCS is not enabled",
          message: "Set TEST_UPLOAD=true to enable Google Cloud Storage downloads"
        },
        { status: 400 }
      );
    }

    const gcsPath = params.path.join('/');

    if (!gcsPath) {
      return NextResponse.json(
        { error: "GCS path is required" },
        { status: 400 }
      );
    }

    console.log(`📥 Solicitud de descarga GCS: ${gcsPath}`);

    // Descargar archivo desde GCS
    const buffer = await gcsService.downloadFile(gcsPath);

    // Obtener metadata para content-type
    let contentType = 'application/octet-stream';
    try {
      const metadata = await gcsService.getFileMetadata(gcsPath);
      contentType = metadata.contentType || contentType;
    } catch (error) {
      console.warn(`⚠️ No se pudo obtener metadata para ${gcsPath}:`, error);
    }

    console.log(`✅ Archivo descargado: ${gcsPath} (${buffer.length} bytes, ${contentType})`);

    // Devolver archivo como respuesta
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, max-age=3600', // Cache por 1 hora
      },
    });

  } catch (error) {
    console.error('❌ Error descargando archivo desde GCS:', error);

    return NextResponse.json(
      {
        error: "Error downloading file from GCS",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}