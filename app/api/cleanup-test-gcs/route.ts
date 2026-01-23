import { NextRequest, NextResponse } from "next/server";
import { gcsService } from "@/lib/gcs-service";

export async function POST(request: NextRequest) {
  try {
    console.log("🧹 Endpoint de limpieza de archivos de test GCS llamado");

    if (process.env.TEST_UPLOAD !== 'true') {
      return NextResponse.json(
        { error: "TEST_UPLOAD debe ser 'true' para limpiar archivos de test" },
        { status: 400 }
      );
    }

    // Buscar archivos de test (que empiecen con 'test-')
    const allFiles = await gcsService.listFiles();
    const testFiles = allFiles.filter(file => file.startsWith('test-'));

    console.log(`🗂️ Encontrados ${testFiles.length} archivos de test`);

    let deletedCount = 0;
    let errors: string[] = [];

    for (const filePath of testFiles) {
      try {
        // Verificar que es realmente un archivo de test reciente (últimas 24 horas)
        const metadata = await gcsService.getFileMetadata(filePath);
        const uploadedAt = new Date(metadata.metadata?.uploadedAt || metadata.timeCreated);
        const hoursSinceUpload = (Date.now() - uploadedAt.getTime()) / (1000 * 60 * 60);

        if (hoursSinceUpload < 24) { // Solo archivos de las últimas 24 horas
          await gcsService.deleteFile(filePath);
          console.log(`🗑️ Eliminado: ${filePath}`);
          deletedCount++;
        } else {
          console.log(`⏰ Archivo antiguo, omitiendo: ${filePath} (${hoursSinceUpload.toFixed(1)}h)`);
        }
      } catch (error) {
        const errorMsg = `Error eliminando ${filePath}: ${error instanceof Error ? error.message : 'Unknown'}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      cleaned: {
        found: testFiles.length,
        deleted: deletedCount,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("❌ Error en limpieza de archivos de test:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}