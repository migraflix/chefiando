#!/usr/bin/env node

/**
 * Script para simular diferentes escenarios de upload de fotos
 * Ayuda a identificar por qué algunos usuarios no pueden subir fotos
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

console.log('🧪 Simulador de escenarios de upload de fotos');
console.log(`📍 URL base: ${BASE_URL}\n`);

// Crear imagen de prueba (1x1 pixel PNG base64)
const TEST_IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

// Escenarios de prueba
const scenarios = [
  {
    name: "✅ Escenario Normal",
    marca: "test-normal",
    products: [{
      name: "Producto Normal",
      description: "Descripción normal sin caracteres especiales",
      price: "25.50",
      tags: ["vegetariano"]
    }],
    expectedSuccess: true
  },
  {
    name: "🔤 Con Acentos y Ñ",
    marca: "test-acentos",
    products: [{
      name: "Café con Leche",
      description: "Delicioso café con leche recién preparada. Añade un toque especial a tu desayuno. Cómodo y fácil de usar.",
      price: "15.99",
      tags: ["bebida", "caliente"]
    }],
    expectedSuccess: true
  },
  {
    name: "🚫 Con Caracteres Especiales Problemáticos",
    marca: "test-especiales",
    products: [{
      name: "Producto con \"comillas\"",
      description: "Descripción con 'comillas simples' y \"dobles\", además de caracteres como <script>alert('xss')</script> y saltos de línea\n\nmúltiples",
      price: "99.99",
      tags: ["especial", "test"]
    }],
    expectedSuccess: false // Puede fallar por sanitización
  },
  {
    name: "📝 Descripción Muy Larga",
    marca: "test-largo",
    products: [{
      name: "Producto con Descripción Larga",
      description: "A".repeat(1500), // Más de 1000 caracteres
      price: "50.00",
      tags: ["largo"]
    }],
    expectedSuccess: false // Debería fallar por longitud
  },
  {
    name: "🏷️ Nombre Muy Largo",
    marca: "test-nombre-largo",
    products: [{
      name: "A".repeat(150), // Más de 100 caracteres
      description: "Descripción normal",
      price: "30.00",
      tags: ["test"]
    }],
    expectedSuccess: false // Debería fallar por longitud
  },
  {
    name: "📸 Múltiples Productos",
    marca: "test-multiple",
    products: [
      {
        name: "Producto 1",
        description: "Primer producto",
        price: "10.00",
        tags: ["primero"]
      },
      {
        name: "Producto 2",
        description: "Segundo producto",
        price: "20.00",
        tags: ["segundo"]
      },
      {
        name: "Producto 3",
        description: "Tercer producto",
        price: "30.00",
        tags: ["tercero"]
      }
    ],
    expectedSuccess: true
  },
  {
    name: "💰 Sin Precio",
    marca: "test-sin-precio",
    products: [{
      name: "Producto Sin Precio",
      description: "Producto sin precio definido",
      price: "",
      tags: ["sin_precio"]
    }],
    expectedSuccess: true // Debería funcionar (precio opcional)
  },
  {
    name: "🏷️ Sin Tags",
    marca: "test-sin-tags",
    products: [{
      name: "Producto Sin Tags",
      description: "Producto sin etiquetas",
      price: "25.00",
      tags: []
    }],
    expectedSuccess: true // Debería funcionar (tags opcionales)
  }
];

async function runScenario(scenario) {
  console.log(`\n🎯 Ejecutando: ${scenario.name}`);
  console.log(`📦 Marca: ${scenario.marca}, Productos: ${scenario.products.length}`);

  try {
    // Crear FormData
    const formData = new FormData();
    formData.append("marca", scenario.marca);
    formData.append("products", JSON.stringify(scenario.products));

    // Agregar imagen de prueba para cada producto
    for (let i = 0; i < scenario.products.length; i++) {
      const testImageBlob = await fetch(`data:image/png;base64,${TEST_IMAGE_BASE64}`).then(r => r.blob());
      const testImageFile = new File([testImageBlob], `test-image-${i + 1}.png`, { type: "image/png" });
      formData.append(`photo_${i}`, testImageFile);
    }

    // Calcular tamaño aproximado
    let totalSize = 0;
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        totalSize += value.size;
      } else if (typeof value === 'string') {
        totalSize += value.length;
      }
    }

    console.log(`📏 Tamaño total: ${Math.round(totalSize / 1024)}KB`);

    // Enviar request
    const startTime = Date.now();

    const response = await fetch(`${BASE_URL}/api/products/upload`, {
      method: "POST",
      body: formData,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    const result = await response.json();

    const success = response.ok && result.success;
    const expectedMatch = success === scenario.expectedSuccess;

    console.log(`⏱️  Duración: ${duration}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`✅ Éxito: ${success ? 'SÍ' : 'NO'}`);
    console.log(`🎯 Esperado: ${scenario.expectedSuccess ? 'SÍ' : 'NO'}`);
    console.log(`📈 Resultado: ${expectedMatch ? '✅ CORRECTO' : '❌ INESPERADO'}`);

    if (!expectedMatch) {
      console.log(`⚠️  Respuesta:`, JSON.stringify(result, null, 2));
    }

    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
      if (result.details) {
        console.log(`📋 Detalles:`, result.details);
      }
    }

    return {
      scenario: scenario.name,
      success,
      expected: scenario.expectedSuccess,
      match: expectedMatch,
      duration,
      status: response.status,
      error: result.error,
      details: result.details
    };

  } catch (error) {
    console.log(`💥 Error fatal: ${error.message}`);
    return {
      scenario: scenario.name,
      success: false,
      expected: scenario.expectedSuccess,
      match: false,
      duration: 0,
      status: 0,
      error: error.message,
      fatal: true
    };
  }
}

async function runAllScenarios() {
  console.log('🚀 Iniciando batería de pruebas...\n');

  const results = [];

  for (const scenario of scenarios) {
    const result = await runScenario(scenario);
    results.push(result);

    // Pequeña pausa entre escenarios
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN FINAL');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success).length;
  const expected = results.filter(r => r.match).length;
  const total = results.length;

  console.log(`✅ Escenarios exitosos: ${successful}/${total}`);
  console.log(`🎯 Comportamiento esperado: ${expected}/${total}`);
  console.log(`📈 Tasa de éxito: ${Math.round((successful / total) * 100)}%`);
  console.log(`🎪 Precisión: ${Math.round((expected / total) * 100)}%`);

  // Mostrar escenarios problemáticos
  const problematic = results.filter(r => !r.match);
  if (problematic.length > 0) {
    console.log('\n🚨 ESCENARIOS PROBLEMÁTICOS:');
    problematic.forEach(result => {
      console.log(`❌ ${result.scenario}: ${result.success ? 'Pasó cuando debería fallar' : 'Falló cuando debería pasar'}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
  }

  // Guardar resultados en archivo
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `upload-test-results-${timestamp}.json`;

  fs.writeFileSync(filename, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    results,
    summary: {
      total,
      successful,
      expected,
      successRate: successful / total,
      accuracy: expected / total
    }
  }, null, 2));

  console.log(`\n💾 Resultados guardados en: ${filename}`);
  console.log('\n🎉 Pruebas completadas!');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runAllScenarios().catch(console.error);
}

module.exports = { runScenario, runAllScenarios, scenarios };