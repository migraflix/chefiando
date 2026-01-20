#!/usr/bin/env node

/**
 * Script para comparar diagnósticos de diferentes usuarios
 * Identifica automáticamente las diferencias entre usuarios que funcionan y los que no
 */

const fs = require('fs');
const path = require('path');

function loadDiagnostic(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Archivo no encontrado: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function compareValues(key, val1, val2, path = '') {
  const fullPath = path ? `${path}.${key}` : key;
  const differences = [];

  if (val1 === val2) return differences;

  // Comparaciones especiales para tipos complejos
  if (key === 'userAgent') {
    const ua1 = val1.toLowerCase();
    const ua2 = val2.toLowerCase();

    if (!ua1.includes('chrome') && ua2.includes('chrome')) {
      differences.push(`${fullPath}: Usuario 1 NO usa Chrome, Usuario 2 SÍ usa Chrome`);
    } else if (ua1.includes('chrome') && !ua2.includes('chrome')) {
      differences.push(`${fullPath}: Usuario 1 usa Chrome, Usuario 2 NO usa Chrome`);
    }

    if (ua1.includes('mobile') && !ua2.includes('mobile')) {
      differences.push(`${fullPath}: Usuario 1 usa dispositivo MÓVIL, Usuario 2 NO`);
    } else if (!ua1.includes('mobile') && ua2.includes('mobile')) {
      differences.push(`${fullPath}: Usuario 1 NO usa móvil, Usuario 2 SÍ usa móvil`);
    }

  } else if (key === 'platform') {
    if (val1 !== val2) {
      differences.push(`${fullPath}: Plataformas diferentes - Usuario1: ${val1}, Usuario2: ${val2}`);
    }

  } else if (key === 'downlink' && val1 && val2) {
    const diff = Math.abs(val1 - val2);
    if (diff > 5) {
      differences.push(`${fullPath}: Velocidad muy diferente - Usuario1: ${val1}Mbps, Usuario2: ${val2}Mbps`);
    }

  } else if (key === 'usedJSHeapSize' && val1 && val2) {
    const mb1 = Math.round(val1 / 1024 / 1024);
    const mb2 = Math.round(val2 / 1024 / 1024);
    const ratio = val1 / val2;

    if (ratio > 2 || ratio < 0.5) {
      differences.push(`${fullPath}: Uso de memoria muy diferente - Usuario1: ${mb1}MB, Usuario2: ${mb2}MB`);
    }

  } else if (key === 'totalSize') {
    const kb1 = Math.round(val1 / 1024);
    const kb2 = Math.round(val2 / 1024);

    if (Math.abs(kb1 - kb2) > 500) { // Diferencia de más de 500KB
      differences.push(`${fullPath}: Tamaño total muy diferente - Usuario1: ${kb1}KB, Usuario2: ${kb2}KB`);
    }

  } else if (key === 'images' && Array.isArray(val1) && Array.isArray(val2)) {
    if (val1.length !== val2.length) {
      differences.push(`${fullPath}: Cantidad de imágenes diferente - Usuario1: ${val1.length}, Usuario2: ${val2.length}`);
    } else {
      val1.forEach((img1, index) => {
        const img2 = val2[index];
        if (img1.size !== img2.size) {
          const kb1 = Math.round(img1.size / 1024);
          const kb2 = Math.round(img2.size / 1024);
          differences.push(`images[${index}].size: Tamaño diferente - Usuario1: ${kb1}KB, Usuario2: ${kb2}KB`);
        }
        if (img1.type !== img2.type) {
          differences.push(`images[${index}].type: Tipo diferente - Usuario1: ${img1.type}, Usuario2: ${img2.type}`);
        }
      });
    }

  } else if (key === 'errors' && Array.isArray(val1) && Array.isArray(val2)) {
    if (val1.length !== val2.length) {
      differences.push(`${fullPath}: Cantidad de errores diferente - Usuario1: ${val1.length}, Usuario2: ${val2.length}`);
    }

  } else if (key === 'warnings' && Array.isArray(val1) && Array.isArray(val2)) {
    if (val1.length !== val2.length) {
      differences.push(`${fullPath}: Cantidad de advertencias diferente - Usuario1: ${val1.length}, Usuario2: ${val2.length}`);
    }

  } else if (typeof val1 !== typeof val2) {
    differences.push(`${fullPath}: Tipos diferentes - Usuario1: ${typeof val1}, Usuario2: ${typeof val2}`);

  } else if (typeof val1 === 'object' && val1 !== null && val2 !== null) {
    // Comparación recursiva de objetos
    const keys1 = Object.keys(val1);
    const keys2 = Object.keys(val2);

    const uniqueKeys1 = keys1.filter(k => !keys2.includes(k));
    const uniqueKeys2 = keys2.filter(k => !keys1.includes(k));

    uniqueKeys1.forEach(k => {
      differences.push(`${fullPath}: Usuario1 tiene propiedad '${k}' que Usuario2 no tiene`);
    });

    uniqueKeys2.forEach(k => {
      differences.push(`${fullPath}: Usuario2 tiene propiedad '${k}' que Usuario1 no tiene`);
    });

    // Comparar propiedades comunes
    keys1.filter(k => keys2.includes(k)).forEach(k => {
      differences.push(...compareValues(k, val1[k], val2[k], fullPath));
    });

  } else {
    differences.push(`${fullPath}: Valores diferentes - Usuario1: ${val1}, Usuario2: ${val2}`);
  }

  return differences;
}

function analyzeDifferences(diag1, diag2) {
  console.log('🔍 ANALIZANDO DIFERENCIAS ENTRE DIAGNÓSTICOS\n');

  console.log('📊 INFORMACIÓN GENERAL:');
  console.log(`   Usuario 1 (Funciona): ${diag1.sessionId} - ${diag1.timestamp}`);
  console.log(`   Usuario 2 (Problema):  ${diag2.sessionId} - ${diag2.timestamp}`);
  console.log('');

  const differences = compareValues('root', diag1, diag2);

  if (differences.length === 0) {
    console.log('✅ NO SE ENCONTRARON DIFERENCIAS SIGNIFICATIVAS');
    console.log('Los diagnósticos son prácticamente idénticos.');
    return;
  }

  console.log(`🚨 ENCONTRADAS ${differences.length} DIFERENCIAS:\n`);

  // Categorizar diferencias
  const categories = {
    navegador: [],
    plataforma: [],
    conexion: [],
    memoria: [],
    imagenes: [],
    errores: [],
    otros: []
  };

  differences.forEach(diff => {
    if (diff.includes('userAgent')) categories.navegador.push(diff);
    else if (diff.includes('platform')) categories.plataforma.push(diff);
    else if (diff.includes('downlink') || diff.includes('effectiveType')) categories.conexion.push(diff);
    else if (diff.includes('memory') || diff.includes('usedJSHeapSize')) categories.memoria.push(diff);
    else if (diff.includes('images') || diff.includes('totalSize')) categories.imagenes.push(diff);
    else if (diff.includes('errors') || diff.includes('warnings')) categories.errores.push(diff);
    else categories.otros.push(diff);
  });

  // Mostrar diferencias por categoría
  Object.entries(categories).forEach(([category, diffs]) => {
    if (diffs.length > 0) {
      console.log(`📂 ${category.toUpperCase()} (${diffs.length}):`);
      diffs.forEach(diff => console.log(`   • ${diff}`));
      console.log('');
    }
  });

  // Análisis de causas probables
  console.log('🎯 ANÁLISIS DE CAUSAS PROBABLES:\n');

  if (categories.navegador.length > 0) {
    console.log('🌐 DIFERENCIAS DE NAVEGADOR:');
    console.log('   Los navegadores manejan APIs de archivos de forma diferente.');
    console.log('   Chrome generalmente tiene mejor soporte que otros navegadores.');
    console.log('   Versiones antiguas pueden tener límites más restrictivos.');
    console.log('');
  }

  if (categories.plataforma.length > 0) {
    console.log('💻 DIFERENCIAS DE PLATAFORMA:');
    console.log('   Móviles tienen menos memoria y procesadores más lentos.');
    console.log('   Límites de batería pueden afectar el rendimiento.');
    console.log('   Conexiones móviles son menos estables.');
    console.log('');
  }

  if (categories.conexion.length > 0) {
    console.log('📡 DIFERENCIAS DE CONEXIÓN:');
    console.log('   Conexiones lentas causan timeouts en operaciones grandes.');
    console.log('   Conexiones inestables fallan en transfers grandes.');
    console.log('   Límites de datos móviles afectan comportamiento.');
    console.log('');
  }

  if (categories.memoria.length > 0) {
    console.log('🧠 DIFERENCIAS DE MEMORIA:');
    console.log('   Navegadores con poca memoria fallan en operaciones grandes.');
    console.log('   Múltiples pestañas abiertas consumen memoria.');
    console.log('   Extensiones del navegador pueden causar leaks.');
    console.log('');
  }

  if (categories.imagenes.length > 0) {
    console.log('📸 DIFERENCIAS EN IMÁGENES:');
    console.log('   Imágenes más grandes requieren más procesamiento.');
    console.log('   Diferentes formatos pueden tener distinto comportamiento.');
    console.log('   Metadatos EXIF pueden causar problemas.');
    console.log('');
  }

  if (categories.errores.length > 0) {
    console.log('❌ DIFERENCIAS EN ERRORES:');
    console.log('   Un usuario tiene errores que el otro no.');
    console.log('   APIs no disponibles o fallando.');
    console.log('   Problemas de compatibilidad específicos.');
    console.log('');
  }

  // Recomendaciones
  console.log('💡 RECOMENDACIONES:');

  if (categories.navegador.some(d => d.includes('Chrome'))) {
    console.log('• Recomendar usar Chrome o Edge (basados en Chromium)');
  }

  if (categories.plataforma.some(d => d.includes('mobile'))) {
    console.log('• Para móviles: Reducir límite de imágenes a 2 máximo');
    console.log('• Implementar compresión automática de imágenes');
  }

  if (categories.conexion.some(d => d.includes('downlink'))) {
    console.log('• Agregar indicadores de progreso para uploads grandes');
    console.log('• Implementar timeout más largo para conexiones lentas');
    console.log('• Permitir reintentos automáticos');
  }

  if (categories.memoria.length > 0) {
    console.log('• Optimizar procesamiento: convertir a base64 en chunks');
    console.log('• Liberar memoria después de cada imagen');
    console.log('• Agregar verificación de memoria antes de procesar');
  }

  console.log('• Agregar logs detallados para debugging específico');
  console.log('• Implementar feature flags para usuarios problemáticos');
}

// Función principal
function main() {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.log('Uso: node compare-diagnostics.js <archivo-usuario-funciona.json> <archivo-usuario-problema.json>');
    console.log('');
    console.log('Ejemplo:');
    console.log('  node compare-diagnostics.js diagnostic-working-user.json diagnostic-problem-user.json');
    process.exit(1);
  }

  try {
    const [file1, file2] = args;
    const diag1 = loadDiagnostic(file1);
    const diag2 = loadDiagnostic(file2);

    console.log('📁 Comparando diagnósticos:');
    console.log(`   ${file1} (usuario que funciona)`);
    console.log(`   ${file2} (usuario con problema)`);
    console.log('');

    analyzeDifferences(diag1, diag2);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { compareValues, analyzeDifferences };