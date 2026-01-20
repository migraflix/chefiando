#!/usr/bin/env node

/**
 * Script para probar que Sentry esté funcionando correctamente
 * Ejecuta una petición a /api/test-error para generar un error de prueba
 */

const https = require('https');

const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

console.log('🧪 Probando Sentry con error de prueba...');
console.log(`📍 URL base: ${BASE_URL}`);

const url = `${BASE_URL}/api/test-error`;

console.log(`🔗 Probando endpoint: ${url}`);

const req = https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('✅ Respuesta del servidor:');
      console.log(JSON.stringify(response, null, 2));

      if (response.sentry === 'Error capturado en Sentry') {
        console.log('🎉 ¡Sentry está funcionando correctamente!');
        console.log('📊 Revisa tu dashboard de Sentry para ver el error de prueba.');
      } else {
        console.log('⚠️  El servidor respondió pero no confirma que Sentry capturó el error.');
      }
    } catch (error) {
      console.error('❌ Error al parsear respuesta JSON:', error.message);
      console.log('📄 Respuesta cruda:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error en la petición:', error.message);
  console.log('💡 Asegúrate de que el servidor esté corriendo en', BASE_URL);
});

req.setTimeout(10000, () => {
  console.error('❌ Timeout: La petición tardó demasiado');
  req.destroy();
});