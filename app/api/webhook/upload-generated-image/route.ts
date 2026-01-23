import { NextRequest, NextResponse } from "next/server";
import { gcsService } from "@/lib/gcs-service";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const CONTENT_TABLE_NAME = "Content";

/**
 * Endpoint para que el webhook suba imágenes generadas por IA
 * Guarda en GCS y actualiza el registro en Airtable
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const imageFile = formData.get('image') as File;
    const recordId = formData.get('recordId') as string;
    const contentType = formData.get('contentType') as string || 'image/jpeg';

    console.log(`🤖 Subiendo imagen generada para record ${recordId}, tamaño: ${imageFile.size} bytes`);

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    if (!recordId) {
      return NextResponse.json(
        { error: 'No recordId provided' },
        { status: 400 }
      );
    }

    console.log(`🤖 Subiendo imagen generada por IA para record ${recordId}`);

    // Convertir File a Buffer
    const buffer = Buffer.from(await imageFile.arrayBuffer());

    // Generar nombre único para la imagen generada
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `generated_${timestamp}_${randomId}_${imageFile.name || 'ai_image.jpg'}`;

    // Subir a GCS
    const gcsResult = await gcsService.uploadFromBuffer(
      buffer,
      fileName,
      contentType,
      {
        prefix: 'generated/', // Carpeta específica para imágenes generadas
        metadata: {
          recordId: recordId,
          source: 'ai_generated',
          originalName: imageFile.name,
          uploadedAt: new Date().toISOString(),
          contentType: contentType,
        }
      }
    );

    console.log(`✅ Imagen generada subida a GCS: ${gcsResult.gcsPath}`);

    // Actualizar el registro en Airtable con las URLs de GCS
    const updateResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${CONTENT_TABLE_NAME}/${recordId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            "GCS Path": gcsResult.gcsPath,
            "GCS Signed URL": gcsResult.signedUrl,
            "GCS Public URL": gcsResult.publicUrl,
            "File Size": gcsResult.size,
            "Status": "Por Revisar", // Cambiar status cuando la imagen está lista
          }
        })
      }
    );

    if (!updateResponse.ok) {
      console.error(`❌ Error actualizando registro ${recordId} en Airtable:`, updateResponse.statusText);
      // No fallar completamente, la imagen ya está en GCS
    } else {
      console.log(`✅ Registro ${recordId} actualizado en Airtable con URLs de GCS`);
    }

    return NextResponse.json({
      success: true,
      recordId,
      gcsPath: gcsResult.gcsPath,
      gcsSignedUrl: gcsResult.signedUrl,
      gcsPublicUrl: gcsResult.publicUrl,
      fileSize: gcsResult.size,
      message: 'Imagen generada subida exitosamente a GCS'
    });

  } catch (error) {
    console.error('❌ Error subiendo imagen generada:', error);

    return NextResponse.json(
      {
        error: 'Error uploading generated image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}