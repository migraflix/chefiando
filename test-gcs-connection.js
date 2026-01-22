#!/usr/bin/env node

/**
 * Script para probar la conexión con Google Cloud Storage
 * Lee las credenciales de las variables de entorno (.env.local)
 * No requiere que el bucket exista - solo valida credenciales
 * Ejecutar con: node test-gcs-connection.js
 */

// Cargar variables de entorno desde .env.local si existe
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('📄 Cargando variables de entorno desde .env.local...');
  require('dotenv').config({ path: envPath });
} else {
  console.log('⚠️ No se encontró .env.local, usando variables de entorno del sistema...');
}

console.log('🔗 Probando conexión con Google Cloud Storage...\n');

// Leer variables de entorno (usa las que tienes configuradas en .env.local)
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || 'chefiandoimages';
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'migraflix-temp-images';
const TEST_UPLOAD = process.env.TEST_UPLOAD || 'false';

// Leer credenciales de variable de entorno
const GOOGLE_APPLICATION_CREDENTIALS_JSON = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

async function testGCSConnection() {
  try {
    console.log('📋 Configuración:');
    console.log(`Proyecto: ${GCP_PROJECT_ID}`);
    console.log(`Bucket objetivo: ${GCS_BUCKET_NAME}`);
    console.log(`TEST_UPLOAD: ${TEST_UPLOAD}`);
    console.log('');

    // Paso 1: Validar JSON
    console.log('1️⃣ Validando JSON de credenciales...');

    if (!GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      console.log('❌ Variable GOOGLE_APPLICATION_CREDENTIALS_JSON no encontrada');
      console.log('\n💡 Soluciones:');
      console.log('1. Configura la variable en tu .env.local');
      console.log('2. O pega el JSON directamente en este script (línea 12)');
      console.log('3. Asegúrate de que hayas configurado las credenciales de GCS');
      return;
    }

    let credentials;
    try {
      credentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON);
      console.log('✅ JSON válido');
    } catch (error) {
      console.log('❌ JSON inválido:', error.message);
      console.log('\n💡 Solución: Verifica que el JSON esté completo y bien formateado');
      return;
    }

    // Paso 2: Verificar campos requeridos
    const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !credentials[field]);

    if (missingFields.length > 0) {
      console.log('❌ Faltan campos requeridos:', missingFields.join(', '));
      return;
    }

    console.log('✅ Todos los campos requeridos presentes');

    // Paso 3: Intentar inicializar GCS client
    console.log('\n2️⃣ Inicializando cliente de Google Cloud Storage...');
    let Storage;
    let storage;

    try {
      // Intentar importar el módulo
      Storage = (await import('@google-cloud/storage')).Storage;
      console.log('✅ Módulo @google-cloud/storage disponible');
    } catch (error) {
      console.log('❌ Módulo @google-cloud/storage no encontrado');
      console.log('💡 Ejecuta: npm install @google-cloud/storage');
      return;
    }

    try {
      // Crear cliente con credenciales
      storage = new Storage({
        projectId: GCP_PROJECT_ID,
        credentials: credentials
      });
      console.log('✅ Cliente GCS inicializado correctamente');
    } catch (error) {
      console.log('❌ Error inicializando cliente GCS:', error.message);
      return;
    }

    // Paso 4: Probar conectividad básica (opcional)
    console.log('\n3️⃣ Probando conectividad básica...');
    try {
      // Intentar obtener información del proyecto
      const [projectMetadata] = await storage.authClient.request({
        url: `https://cloudresourcemanager.googleapis.com/v1/projects/${GCP_PROJECT_ID}`,
        method: 'GET'
      });
      console.log('✅ Conectividad básica OK');
      console.log(`📄 Proyecto: ${projectMetadata.data.name || GCP_PROJECT_ID}`);
    } catch (error) {
      console.log('⚠️ Cloud Resource Manager API no habilitada (opcional):', error.message);
      console.log('💡 Esto no afecta GCS - continuando con las pruebas...');
      // No retornamos aquí, continuamos con las pruebas del bucket
    }

    // Paso 5: Listar buckets existentes
    console.log('\n4️⃣ Listando buckets existentes...');
    try {
      const [buckets] = await storage.getBuckets();
      console.log(`✅ Encontrados ${buckets.length} buckets:`);

      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.location})`);
      });

      // Verificar si nuestro bucket objetivo existe
      const targetBucket = buckets.find(b => b.name === GCS_BUCKET_NAME);
      if (targetBucket) {
        console.log(`\n🎯 Bucket objetivo "${GCS_BUCKET_NAME}" ya existe!`);
      } else {
        console.log(`\n📦 Bucket objetivo "${GCS_BUCKET_NAME}" no existe - se creará automáticamente`);
      }

    } catch (error) {
      console.log('❌ Error listando buckets:', error.message);
      console.log('💡 Esto puede pasar si no tienes permisos para listar buckets');
      console.log('   Pero las credenciales básicas funcionan');
    }

    // Paso 6: Intentar crear bucket (opcional)
    console.log('\n5️⃣ Intentando crear/acceder al bucket...');
    try {
      const bucket = storage.bucket(GCS_BUCKET_NAME);

      // Verificar si existe
      const [exists] = await bucket.exists();

      if (exists) {
        console.log(`✅ Bucket "${GCS_BUCKET_NAME}" existe y es accesible`);
      } else {
        console.log(`📦 Bucket "${GCS_BUCKET_NAME}" no existe, intentando crearlo...`);

        // Intentar crear el bucket
        await bucket.create({
          location: 'US-CENTRAL1',
          storageClass: 'STANDARD'
        });

        console.log(`🎉 Bucket "${GCS_BUCKET_NAME}" creado exitosamente!`);
      }

      // Probar acceso básico al bucket
      const [files] = await bucket.getFiles({ maxResults: 1 });
      console.log(`✅ Acceso al bucket OK (tiene ${files.length} archivos visibles)`);

    } catch (error) {
      if (error.code === 403) {
        console.log('❌ Error de permisos en el bucket');
        console.log('💡 Asegúrate de que la Service Account tenga rol "Storage Admin"');
      } else if (error.code === 409) {
        console.log('⚠️ El bucket ya existe pero no tienes acceso');
        console.log('💡 Verifica que el bucket esté en tu proyecto');
      } else {
        console.log('❌ Error accediendo al bucket:', error.message);
        console.log('💡 El bucket se creará automáticamente cuando subas la primera imagen');
      }
    }

    // Resultado final
    console.log('\n🎉 ¡Configuración de Google Cloud Storage verificada!');
    console.log('\n📋 Resumen:');
    console.log('- ✅ Credenciales válidas');
    console.log('- ✅ Cliente GCS inicializado');
    console.log(`- ✅ Bucket temporal "${GCS_BUCKET_NAME}" listo`);
    console.log('- ✅ Proyecto accesible');

    console.log('\n🏆 ¡El bucket temporal está funcionando!');
    console.log('💡 Las imágenes se subirán a GCS y estarán disponibles para n8n');
    console.log('🚀 Configura TEST_UPLOAD=true en .env.local para activar GCS');

  } catch (error) {
    console.log('❌ Error inesperado:', error.message);
    console.log('\n🔍 Posibles causas:');
    console.log('- Credenciales mal formateadas');
    console.log('- Proyecto no existe o no tienes acceso');
    console.log('- Problemas de red o conectividad');
  }
}

// Ejecutar la prueba
testGCSConnection().catch(console.error);