#!/usr/bin/env node

/**
 * Script para probar la subida de productos con GCS
 * Ejecutar con: node test-upload.js
 */

// Simular datos de un producto
const testProduct = {
  marca: "test-brand",
  brandRecordId: "test-record-id",
  batch: 1,
  totalBatches: 1,
  products: [{
    recordId: "test-product-123",
    nombre: "test-image.jpg",
    contentType: "image/jpeg",
    base64: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z"
  }]
};

async function testUpload() {
  console.log('🧪 Probando subida de producto con GCS...\n');

  try {
    const response = await fetch('http://localhost:3000/api/products/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testProduct)
    });

    console.log(`📡 Respuesta del servidor: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Subida exitosa!');
      console.log('📋 Resultado:', JSON.stringify(result, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ Error en la subida:', error);
    }

  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    console.log('\n💡 Asegúrate de que el servidor esté corriendo: npm run dev');
  }
}

// Ejecutar la prueba
testUpload().catch(console.error);