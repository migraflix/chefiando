import { NextRequest, NextResponse } from "next/server";
import { gcsService } from "@/lib/gcs-service";

export async function POST(request: NextRequest) {
  try {
    // Verificar si GCS está habilitado
    if (process.env.TEST_UPLOAD !== 'true') {
      return NextResponse.json(
        {
          error: "GCS is not enabled",
          message: "Set TEST_UPLOAD=true to enable Google Cloud Storage uploads"
        },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'No productId provided' },
        { status: 400 }
      );
    }

    console.log(`☁️ Subiendo imagen a GCS para producto ${productId}: ${file.name} (${file.size} bytes)`);

    // Convertir File a Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Crear un File-like object desde Buffer
    const fileObject = {
      buffer,
      originalname: file.name,
      mimetype: file.type,
      size: file.size
    };

    // Generar nombre único (subir directamente al root)
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}_${randomId}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    // Subir a GCS
    const result = await gcsService.uploadFromBuffer(
      buffer,
      fileName,
      file.type,
      {
        metadata: {
          productId: productId,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          source: 'api-upload'
        }
      }
    );

    console.log(`✅ Imagen subida a GCS: ${result.gcsPath}`);

    return NextResponse.json({
      success: true,
      gcsPath: result.gcsPath,
      gcsSignedUrl: result.signedUrl,
      fileName: result.fileName,
      size: result.size
    });

  } catch (error) {
    console.error('❌ Error subiendo imagen a GCS:', error);

    return NextResponse.json(
      {
        error: 'Error uploading to GCS',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}