/**
 * Script para verificar que las variables de entorno estén configuradas correctamente
 * Ejecutar con: node scripts/check-env.js
 * 
 * Nota: Este script lee directamente el archivo .env.local
 */

const fs = require('fs')
const path = require('path')

// Leer .env.local manualmente
const envPath = path.join(process.cwd(), '.env.local')
let envVars = {}

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim()
      }
    }
  })
} else {
  console.log('⚠️  Archivo .env.local no encontrado\n')
}

console.log('🔍 Verificando variables de entorno...\n')

const requiredVars = [
  'AIRTABLE_API_KEY',
  'AIRTABLE_BASE_ID',
]

const optionalVars = [
  'PRODUCTOS_WEBHOOK',
  'PRODUCTS_WEBHOOK_URL',
  'NEXT_PUBLIC_URL',
  'VERCEL_URL',
  'feedbackWebhook',
]

let allGood = true

console.log('📋 Variables Requeridas:')
requiredVars.forEach(varName => {
  // Primero verificar en envVars (del archivo), luego en process.env
  const value = envVars[varName] || process.env[varName]
  const exists = !!value
  const length = value ? value.length : 0
  
  if (exists) {
    console.log(`  ✅ ${varName}: ${'*'.repeat(Math.min(length, 20))}${length > 20 ? '...' : ''} (${length} caracteres)`)
  } else {
    console.log(`  ❌ ${varName}: NO CONFIGURADA`)
    allGood = false
  }
})

console.log('\n📋 Variables Opcionales:')
optionalVars.forEach(varName => {
  const value = envVars[varName] || process.env[varName]
  if (value) {
    console.log(`  ✅ ${varName}: Configurada`)
  } else {
    console.log(`  ⚠️  ${varName}: No configurada (opcional)`)
  }
})

console.log('\n' + '='.repeat(50))

if (allGood) {
  console.log('✅ Todas las variables requeridas están configuradas')
  console.log('\n💡 Si aún tienes errores, verifica:')
  console.log('   1. Reiniciar el servidor de desarrollo (Ctrl+C y luego npm run dev)')
  console.log('   2. Verificar que los valores sean correctos')
  console.log('   3. Verificar que el archivo .env.local esté en la raíz del proyecto')
} else {
  console.log('❌ Faltan variables de entorno requeridas')
  console.log('\n💡 Asegúrate de tener un archivo .env.local con:')
  console.log('   AIRTABLE_API_KEY=tu_api_key')
  console.log('   AIRTABLE_BASE_ID=tu_base_id')
}

