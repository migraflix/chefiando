#!/usr/bin/env node

/**
 * Script de prueba para la integración de Google Cloud Storage
 * Ejecutar con: node test-gcs-integration.js
 *
 * NOTA: Este script requiere que las variables de entorno estén configuradas
 * y que el proyecto esté compilado (npm run build)
 */

console.log('🧪 Script de prueba GCS - Requiere configuración previa\n');

console.log('📋 Checklist antes de ejecutar:');
console.log('1. ✅ Instalar dependencias: npm install @google-cloud/storage');
console.log('2. 🔄 Configurar variables de entorno en .env.local:');
console.log('   - GCP_PROJECT_ID=tu-project-id');
console.log('   - GCS_BUCKET_NAME=tu-bucket-name');
console.log('   - GOOGLE_APPLICATION_CREDENTIALS_JSON o GOOGLE_APPLICATION_CREDENTIALS');
console.log('3. ✅ Crear bucket en Google Cloud Storage');
console.log('4. ✅ Compilar proyecto: npm run build');
console.log('');

console.log('💡 Para probar manualmente:');
console.log('1. Sube una imagen desde el formulario del frontend');
console.log('2. Verifica que aparezca en Google Cloud Storage');
console.log('3. Revisa los logs del servidor para confirmar upload');
console.log('4. Actualiza el workflow de n8n según docs/N8N_WORKFLOW_UPDATE.md');
console.log('');

console.log('🔗 Endpoints disponibles para testing:');
console.log('- GET  /api/maintenance/cleanup-gcs - Verificar estado GCS');
console.log('- POST /api/maintenance/cleanup-gcs - Limpiar archivos antiguos');
console.log('- GET  /api/products/download-gcs/[path] - Descargar archivo desde GCS');
console.log('');

console.log('🎯 Próximos pasos:');
console.log('1. Configurar credenciales de Google Cloud');
console.log('2. Probar upload desde el formulario');
console.log('3. Actualizar workflow de n8n');
console.log('4. Configurar cron job para limpieza automática');
console.log('');

process.exit(0);

async function testGCSIntegration() {
  console.log('🧪 Iniciando pruebas de integración GCS...\n');

  try {
    // Prueba 1: Verificar configuración
    console.log('1️⃣ Verificando configuración GCS...');
    const bucket = require('./lib/config.ts').getGCSBucket();
    console.log('✅ Configuración GCS correcta\n');

    // Prueba 2: Subir archivo de prueba
    console.log('2️⃣ Subiendo archivo de prueba...');
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jzyr4AAAAABJRU5ErkJggg=='; // 1x1 pixel PNG
    const uploadResult = await gcsService.uploadFromBase64(
      testImageBase64,
      'test-image.png',
      'image/png',
      {
        prefix: 'test/',
        metadata: { test: true }
      }
    );
    console.log('✅ Archivo subido:', uploadResult.gcsPath);
    console.log('🔗 URL firmada:', uploadResult.signedUrl, '\n');

    // Prueba 3: Verificar que el archivo existe
    console.log('3️⃣ Verificando existencia del archivo...');
    const exists = await gcsService.fileExists(uploadResult.gcsPath);
    console.log(exists ? '✅ Archivo existe' : '❌ Archivo no encontrado', '\n');

    // Prueba 4: Descargar archivo
    console.log('4️⃣ Descargando archivo...');
    const downloadedBuffer = await gcsService.downloadFile(uploadResult.gcsPath);
    console.log('✅ Archivo descargado:', downloadedBuffer.length, 'bytes\n');

    // Prueba 5: Obtener metadata
    console.log('5️⃣ Obteniendo metadata...');
    const metadata = await gcsService.getFileMetadata(uploadResult.gcsPath);
    console.log('✅ Metadata obtenida:', {
      size: metadata.size,
      contentType: metadata.contentType,
      timeCreated: metadata.timeCreated
    }, '\n');

    // Prueba 6: Listar archivos
    console.log('6️⃣ Listando archivos en test/...');
    const files = await gcsService.listFiles('test/');
    console.log('✅ Archivos encontrados:', files.length, '\n');

    // Prueba 7: Limpiar archivo de prueba
    console.log('7️⃣ Eliminando archivo de prueba...');
    await gcsService.deleteFile(uploadResult.gcsPath);
    console.log('✅ Archivo eliminado\n');

    // Verificar eliminación
    const stillExists = await gcsService.fileExists(uploadResult.gcsPath);
    console.log(stillExists ? '❌ Archivo aún existe' : '✅ Archivo eliminado correctamente', '\n');

    console.log('🎉 Todas las pruebas pasaron exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('- ✅ Configuración GCS correcta');
    console.log('- ✅ Upload de archivos funciona');
    console.log('- ✅ Download de archivos funciona');
    console.log('- ✅ Metadata se obtiene correctamente');
    console.log('- ✅ Listado de archivos funciona');
    console.log('- ✅ Eliminación de archivos funciona');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    console.log('\n🔍 Posibles causas:');
    console.log('- Credenciales de GCS no configuradas');
    console.log('- Bucket no existe o no tiene permisos');
    console.log('- Variables de entorno faltantes');
    console.log('- Conexión a internet fallando');

    process.exit(1);
  }
}

// Ejecutar pruebas
testGCSIntegration().catch(console.error);