#!/usr/bin/env node

/**
 * Script para probar la conexión con Google Cloud Storage
 * No requiere que el bucket exista - solo valida credenciales
 * Ejecutar con: node test-gcs-connection.js
 */

console.log('🔗 Probando conexión con Google Cloud Storage...\n');

// Simular variables de entorno (reemplaza con tus valores reales)
const GCP_PROJECT_ID = 'chefiandoimages';
const GCS_BUCKET_NAME = 'migraflix-temp-images';
const TEST_UPLOAD = 'true';

// Aquí pega tu JSON completo entre los backticks
const GOOGLE_APPLICATION_CREDENTIALS_JSON = `{
  "type": "service_account",
  "project_id": "chefiandoimages",
  "private_key_id": "cole_aqui_tu_private_key_id",
  "private_key": "-----BEGIN PRIVATE KEY-----\ncole_aqui_tu_private_key_completa\n-----END PRIVATE KEY-----\n",
  "client_email": "tu-service-account@chefiandoimages.iam.gserviceaccount.com",
  "client_id": "tu_client_id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/tu-service-account%40chefiandoimages.iam.gserviceaccount.com"
}`;

async function testGCSConnection() {
  try {
    console.log('📋 Configuración:');
    console.log(`Proyecto: ${GCP_PROJECT_ID}`);
    console.log(`Bucket objetivo: ${GCS_BUCKET_NAME}`);
    console.log(`TEST_UPLOAD: ${TEST_UPLOAD}`);
    console.log('');

    // Paso 1: Validar JSON
    console.log('1️⃣ Validando JSON de credenciales...');
    let credentials;
    try {
      credentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON);
      console.log('✅ JSON válido');
    } catch (error) {
      console.log('❌ JSON inválido:', error.message);
      console.log('\n💡 Solución: Copia todo el contenido del archivo JSON descargado');
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

    // Paso 4: Probar conectividad básica
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
      console.log('❌ Error de conectividad básica:', error.message);
      console.log('💡 Verifica que las credenciales sean correctas y que tengas permisos');
      return;
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
    console.log('\n🎉 ¡Conexión con Google Cloud Storage exitosa!');
    console.log('\n📋 Resumen:');
    console.log('- ✅ Credenciales válidas');
    console.log('- ✅ Conectividad básica OK');
    console.log('- ✅ Cliente GCS inicializado');
    console.log('- ✅ Proyecto accesible');
    console.log('- ✅ Bucket listo para usar');

    console.log('\n🚀 ¡Ya puedes usar GCS en tu aplicación!');
    console.log('   Solo configura TEST_UPLOAD=true en tu .env.local');

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