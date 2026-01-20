#!/usr/bin/env node

/**
 * Script para probar uploads con múltiples imágenes pesadas
 * Simula el escenario donde algunos usuarios no pueden subir fotos
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

console.log('🧪 Test de Múltiples Imágenes Pesadas');
console.log(`📍 URL base: ${BASE_URL}\n`);

// Función para crear una imagen base64 más grande (simulando una foto real)
function createLargeTestImage(sizeInKB = 500) {
  // Crear una imagen PNG base64 más grande repitiendo el patrón
  const baseImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  // Repetir para hacerla más grande
  const repetitions = Math.ceil((sizeInKB * 1024) / baseImage.length);
  let largeImage = baseImage.repeat(repetitions);

  // Limitar a un tamaño razonable para el test
  if (largeImage.length > 1024 * 1024) { // 1MB máximo para test
    largeImage = largeImage.substring(0, 1024 * 1024);
  }

  return largeImage;
}

async function testMultipleHeavyPhotos(numPhotos = 3, imageSizeKB = 300) {
  console.log(`\n🖼️  Test: ${numPhotos} fotos de ~${imageSizeKB}KB cada una`);
  console.log(`📊 Tamaño total estimado: ~${numPhotos * imageSizeKB}KB`);

  try {
    // Crear FormData
    const formData = new FormData();
    formData.append("marca", `test-multi-heavy-${Date.now()}`);

    // Crear productos de prueba
    const products = [];
    for (let i = 0; i < numPhotos; i++) {
      products.push({
        name: `Producto Pesado ${i + 1}`,
        description: `Descripción del producto ${i + 1}. Esta es una descripción larga para probar el procesamiento de texto junto con imágenes pesadas. `.repeat(5),
        price: `${(i + 1) * 25}.99`,
        tags: ["pesado", "test", `foto${i + 1}`]
      });
    }

    formData.append("products", JSON.stringify(products));

    // Agregar imágenes pesadas
    console.log(`📸 Creando ${numPhotos} imágenes de prueba...`);
    for (let i = 0; i < numPhotos; i++) {
      const largeImageBase64 = createLargeTestImage(imageSizeKB);
      const imageBlob = await fetch(`data:image/png;base64,${largeImageBase64}`).then(r => r.blob());
      const imageFile = new File([imageBlob], `heavy-test-image-${i + 1}.png`, { type: "image/png" });

      formData.append(`photo_${i}`, imageFile);
      console.log(`   📁 Foto ${i + 1}: ${Math.round(imageFile.size / 1024)}KB reales`);
    }

    // Calcular tamaño total real
    let totalSize = 0;
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        totalSize += value.size;
      } else if (typeof value === 'string') {
        totalSize += value.length;
      }
    }

    console.log(`📦 Tamaño total real del FormData: ${Math.round(totalSize / 1024)}KB`);
    console.log(`🚀 Enviando petición...`);

    const startTime = Date.now();

    const response = await fetch(`${BASE_URL}/api/products/upload`, {
      method: "POST",
      body: formData,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️  Duración total: ${duration}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    const result = await response.json();

    if (!response.ok) {
      console.log(`❌ Error en respuesta:`, JSON.stringify(result, null, 2));
      return {
        success: false,
        duration,
        status: response.status,
        error: result.error,
        details: result.details
      };
    } else {
      console.log(`✅ Éxito:`, JSON.stringify(result, null, 2));
      return {
        success: true,
        duration,
        status: response.status,
        productsCount: result.productsCount
      };
    }

  } catch (error) {
    console.log(`💥 Error fatal: ${error.message}`);
    return {
      success: false,
      duration: 0,
      error: error.message,
      fatal: true
    };
  }
}

async function runMultipleTests() {
  console.log('🚀 Iniciando batería de tests con imágenes pesadas...\n');

  const testScenarios = [
    { photos: 1, sizeKB: 100, description: "1 foto pequeña (control)" },
    { photos: 2, sizeKB: 200, description: "2 fotos medianas" },
    { photos: 3, sizeKB: 300, description: "3 fotos grandes (escenario problemático)" },
    { photos: 2, sizeKB: 500, description: "2 fotos muy grandes" },
    { photos: 4, sizeKB: 200, description: "4 fotos medianas" },
  ];

  const results = [];

  for (const scenario of testScenarios) {
    console.log(`\n🎯 ${scenario.description}`);
    console.log(`=`.repeat(50));

    const result = await testMultipleHeavyPhotos(scenario.photos, scenario.sizeKB);
    results.push({
      ...scenario,
      ...result
    });

    // Pausa entre tests para no sobrecargar
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Resumen final
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 RESUMEN DE TESTS CON MÚLTIPLES IMÁGENES PESADAS`);
  console.log(`${'='.repeat(60)}`);

  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const problematic = results.filter(r => !r.success);

  console.log(`✅ Tests exitosos: ${successful}/${total}`);

  if (problematic.length > 0) {
    console.log(`\n🚨 TESTS PROBLEMÁTICOS:`);
    problematic.forEach(result => {
      console.log(`❌ ${result.description}: ${result.error || 'Error desconocido'}`);
      if (result.duration > 25000) { // Más de 25 segundos
        console.log(`   ⚠️  Duración excesiva: ${result.duration}ms (posible timeout de Vercel)`);
      }
    });
  }

  // Guardar resultados
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `multi-photo-test-results-${timestamp}.json`;

  fs.writeFileSync(filename, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    results,
    summary: {
      total,
      successful,
      failed: total - successful,
      successRate: successful / total
    }
  }, null, 2));

  console.log(`\n💾 Resultados guardados en: ${filename}`);

  if (problematic.length > 0) {
    console.log(`\n🔍 RECOMENDACIONES:`);
    console.log(`   1. Revisar límites de tiempo de Vercel (10s hobby, 30s pro)`);
    console.log(`   2. Considerar procesamiento asíncrono para imágenes grandes`);
    console.log(`   3. Implementar compresión de imágenes antes del upload`);
    console.log(`   4. Agregar límites de tamaño más estrictos por imagen`);
  }

  console.log(`\n🎉 Tests completados!`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runMultipleTests().catch(console.error);
}

module.exports = { testMultipleHeavyPhotos, runMultipleTests };