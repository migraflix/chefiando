import { NextRequest, NextResponse } from "next/server";
import { gcsService } from "@/lib/gcs-service";

/**
 * Sanitiza el nombre de archivo para evitar problemas con GCS
 * - Remueve acentos y caracteres especiales (português, español, etc.)
 * - Remueve paréntesis, corchetes, llaves
 * - Remueve espacios y caracteres de escape
 * - Solo permite letras, números, guiones, guiones bajos y puntos
 */
function sanitizeFileName(fileName: string): string {
  // Separar nombre y extensión
  const lastDot = fileName.lastIndexOf('.');
  const name = lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
  const ext = lastDot > 0 ? fileName.substring(lastDot) : '';

  // Normalizar caracteres acentuados (NFD descompone, luego removemos diacríticos)
  let sanitized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/ñ/gi, 'n') // ñ -> n
    .replace(/ç/gi, 'c') // ç -> c
    .replace(/[()[\]{}]/g, '') // Remover paréntesis, corchetes, llaves
    .replace(/\s+/g, '_') // Espacios -> guiones bajos
    .replace(/['"`,;:!?@#$%^&*+=<>|\\\/~`]/g, '') // Remover caracteres especiales
    .replace(/[^\w.-]/g, '_') // Cualquier otro caracter -> guion bajo
    .replace(/_+/g, '_') // Múltiples guiones bajos -> uno solo
    .replace(/^_|_$/g, '') // Remover guiones bajos al inicio/final
    .toLowerCase();

  // Si el nombre queda vacío, usar 'file'
  if (!sanitized) {
    sanitized = 'file';
  }

  // Sanitizar también la extensión
  const sanitizedExt = ext.toLowerCase().replace(/[^a-z0-9.]/g, '');

  return sanitized + sanitizedExt;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar si GCS está habilitado
    const isGcsEnabled = (process.env.NODE_ENV === 'production' && !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) ||
                        process.env.TEST_UPLOAD === 'true';

    if (!isGcsEnabled) {
      return NextResponse.json(
        {
          error: "GCS is not enabled",
          message: "Configure GOOGLE_APPLICATION_CREDENTIALS_JSON or set TEST_UPLOAD=true to enable Google Cloud Storage uploads"
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

    // Sanitizar y generar nombre único (subir directamente al root)
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const sanitizedName = sanitizeFileName(file.name);
    const fileName = `${timestamp}_${randomId}_${sanitizedName}`;

    console.log(`📝 Nombre original: "${file.name}" → Sanitizado: "${sanitizedName}"`);

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