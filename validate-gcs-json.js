#!/usr/bin/env node

/**
 * Script para validar que el JSON de Google Cloud Storage es válido
 * Ejecutar con: node validate-gcs-json.js
 */

console.log('🔍 Validando configuración de Google Cloud Storage...\n');

// Simular las variables de entorno (reemplaza con tus valores reales)
const GCP_PROJECT_ID = 'chefiandoimages';
const GCS_BUCKET_NAME = 'migraflix-temp-images';
const TEST_UPLOAD = 'true';

// Aquí pega tu JSON completo entre las comillas
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

console.log('📋 Variables de configuración:');
console.log(`GCP_PROJECT_ID: ${GCP_PROJECT_ID}`);
console.log(`GCS_BUCKET_NAME: ${GCS_BUCKET_NAME}`);
console.log(`TEST_UPLOAD: ${TEST_UPLOAD}`);
console.log('');

try {
  // Intentar parsear el JSON
  const credentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS_JSON);

  console.log('✅ JSON válido - Credenciales parseadas correctamente');
  console.log('');

  // Validar campos requeridos
  const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id'];
  const missingFields = requiredFields.filter(field => !credentials[field]);

  if (missingFields.length > 0) {
    console.log('❌ Faltan campos requeridos:', missingFields.join(', '));
  } else {
    console.log('✅ Todos los campos requeridos están presentes');
  }

  // Validar que el project_id coincida
  if (credentials.project_id !== GCP_PROJECT_ID) {
    console.log(`❌ El project_id en las credenciales (${credentials.project_id}) no coincide con GCP_PROJECT_ID (${GCP_PROJECT_ID})`);
  } else {
    console.log('✅ El project_id coincide correctamente');
  }

  // Validar que sea una service account
  if (credentials.type !== 'service_account') {
    console.log(`❌ Tipo de credencial incorrecto: ${credentials.type} (debería ser 'service_account')`);
  } else {
    console.log('✅ Tipo de credencial correcto: service_account');
  }

  // Mostrar información de la cuenta
  console.log('');
  console.log('📧 Información de la Service Account:');
  console.log(`Email: ${credentials.client_email}`);
  console.log(`Client ID: ${credentials.client_id}`);
  console.log(`Project ID: ${credentials.project_id}`);

  console.log('');
  console.log('🎉 Validación completada exitosamente!');
  console.log('');
  console.log('💡 Próximos pasos:');
  console.log('1. Copia las variables validadas a tu .env.local');
  console.log('2. Reinicia tu servidor de desarrollo');
  console.log('3. Prueba subir una imagen desde el formulario');

} catch (error) {
  console.log('❌ Error al validar el JSON:');
  console.log(error.message);
  console.log('');
  console.log('🔧 Solución:');
  console.log('1. Abre el archivo JSON descargado de Google Cloud');
  console.log('2. Copia TODO el contenido (asegúrate de incluir las llaves {} )');
  console.log('3. Pégalo entre los backticks (`) en este script');
  console.log('4. Ejecuta el script nuevamente');
}