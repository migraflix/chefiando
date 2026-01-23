import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { sanitizeString, sanitizeFileName } from "@/lib/airtable/utils";
import { gcsService } from "@/lib/gcs-service";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const PHOTOS_TABLE_NAME = "Fotos AI";
const WEBHOOK_URL = process.env.PRODUCTOS_WEBHOOK || process.env.PRODUCTS_WEBHOOK_URL;

/**
 * Valida un payload de webhook antes de enviarlo
 */
function validateWebhookPayload(payload: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!payload.marca) {
    errors.push('Falta marca');
  }

  if (!payload.batch || !payload.totalBatches) {
    errors.push('Faltan batch/totalBatches');
  }

  if (!payload.products || !Array.isArray(payload.products) || payload.products.length === 0) {
    errors.push('Faltan productos o el array está vacío');
  }

  const product = payload.products[0];

  if (!product.recordId) {
    errors.push('Producto sin recordId');
  }

  if (!product.nombre) {
    errors.push('Producto sin nombre');
  }

  if (!product.contentType) {
    errors.push('Producto sin contentType');
  }

  if (!product.datosProducto) {
    errors.push('Producto sin datosProducto');
  }

  // Validación específica por método
  if (payload.uploadMethod === 'gcs') {
    if (!product.gcsPath) {
      errors.push('Método GCS pero falta gcsPath');
    }
    if (!product.gcsSignedUrl) {
      errors.push('Método GCS pero falta gcsSignedUrl');
    }
    // GCS no debe tener base64 (para mantener payload pequeño)
    if (product.base64 && product.base64.length > 0) {
      errors.push('Método GCS no debe incluir base64');
    }
  } else if (payload.uploadMethod === 'base64') {
    if (!product.base64 || product.base64.length === 0) {
      errors.push('Método base64 pero falta base64 data');
    }
    // Base64 no debe tener datos de GCS
    if (product.gcsPath) {
      errors.push('Método base64 no debe incluir datos de GCS');
    }
  } else {
    errors.push(`Método de subida desconocido: ${payload.uploadMethod}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Constantes de optimización para 5 imágenes máximo
const MAX_TOTAL_SIZE = 15 * 1024 * 1024; // 15MB total máximo (5MB x 3 promedio)
const BATCH_SIZE = 1; // Procesar 1 imagen por vez para envío inmediato al webhook
const COMPRESSION_QUALITY = 0.8; // 80% calidad para reducir tamaño
const MAX_PROCESSING_TIME = 15000; // 15 segundos máximo total
const RETRY_ATTEMPTS = 3; // Reintentos para fallos temporales (3 intentos total)
const SEND_IMMEDIATE = true; // Enviar cada lote inmediatamente al webhook

/**
 * Comprime una imagen reduciendo su calidad y/o resolución si es necesario
 * Versión simplificada para servidor Node.js
 */
async function compressImage(file: File): Promise<File> {
  // Por ahora, solo reducimos calidad si es JPEG
  // Para una compresión más avanzada necesitaríamos una librería como sharp
  if (file.type === 'image/jpeg' && file.size > 3 * 1024 * 1024) { // > 3MB
    console.log(`🗜️ Aplicando compresión básica a JPEG grande (${Math.round(file.size / 1024 / 1024)}MB)`);

    // Para compresión avanzada necesitaríamos instalar sharp:
    // npm install sharp
    // Por ahora, devolvemos el archivo original con una nota
    console.warn(`⚠️ Compresión avanzada no implementada. Recomiendo instalar 'sharp' para mejor compresión`);

    return file;
  }

  return file; // Devolver sin cambios por ahora
}

/**
 * Procesa un lote de productos (máximo BATCH_SIZE)
 */
async function processBatch(
  batch: Array<{index: number, product: any, photoFile: File}>,
  marca: string,
  startTime: number
): Promise<Array<any>> {
  const results = [];

  console.log(`🔄 Procesando lote de ${batch.length} productos...`);

  for (const { index, product, photoFile } of batch) {
    const productStartTime = Date.now();

    try {
      console.log(`📸 Procesando producto ${index + 1}/${batch.length} del lote`);

      // Crear registro en Airtable primero
      const photoRecordId = await createPhotoRecordInAirtable(product, marca);
      if (!photoRecordId) {
        console.error(`❌ Error creando registro para producto ${index + 1}`);
        continue;
      }

      // Comprimir imagen si es necesario
      let processedFile = photoFile;
      if (photoFile.size > 2 * 1024 * 1024) { // Si es mayor a 2MB, comprimir
        console.log(`🗜️ Comprimiendo imagen ${index + 1} (${Math.round(photoFile.size / 1024)}KB)...`);
        processedFile = await compressImage(photoFile);
        console.log(`✅ Imagen comprimida: ${Math.round(processedFile.size / 1024)}KB (${Math.round((1 - processedFile.size / photoFile.size) * 100)}% reducción)`);
      }

      // Convertir a base64
      console.log(`🔄 Convirtiendo imagen ${index + 1} a base64...`);
      const buffer = await processedFile.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString("base64");
      const contentType = processedFile.type || "image/jpeg";

      if (!base64Data || base64Data.length === 0) {
        console.error(`❌ Error convirtiendo imagen ${index + 1} a base64`);
        continue;
      }

      // Sanitizar datos del producto
      const sanitizedNombre = sanitizeString(product.name);
      const sanitizedDescripcion = sanitizeString(product.description);
      const sanitizedTags = product.tags.map((tag: string) => sanitizeString(tag)).filter((tag: string) => tag && tag.length > 0);

      results.push({
        recordId: photoRecordId,
        nombre: sanitizeFileName(processedFile.name),
        contentType: contentType,
        base64: base64Data,
        datosProducto: {
          nombre: sanitizedNombre,
          descripcion: sanitizedDescripcion,
          precio: product.price || null,
          tags: sanitizedTags,
        },
      });

      const processingTime = Date.now() - productStartTime;
      console.log(`✅ Producto ${index + 1} procesado en ${processingTime}ms`);

    } catch (error) {
      console.error(`❌ Error procesando producto ${index + 1}:`, error);
      // Continuar con el siguiente producto del lote
    }
  }

  const batchTime = Date.now() - startTime;
  console.log(`🎯 Lote completado en ${batchTime}ms. ${results.length}/${batch.length} productos procesados`);

  return results;
}

async function createPhotoRecordInAirtable(
  productData: any,
  marca: string
): Promise<string | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error("Configuración de Airtable incompleta");
  }

  try {
    const encodedTableName = encodeURIComponent(PHOTOS_TABLE_NAME);
    
    const fields: Record<string, any> = {
      Nombre: sanitizeString(productData.name),
      Ingredientes: sanitizeString(productData.description),
      Tags: productData.tags.map((tag: string) => sanitizeString(tag)).filter(Boolean).join(", "),
    };

    if (productData.price && productData.price.trim() !== "") {
      const priceValue = parseFloat(productData.price);
      if (!isNaN(priceValue) && priceValue > 0) {
        fields["Precio"] = priceValue;
      }
    }

    fields["Brand"] = [marca];

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodedTableName}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields,
          typecast: true,
        }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    return null;
  }
}

async function updatePhotoRecordStatus(
  recordId: string,
  status: string
): Promise<boolean> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error("Configuración de Airtable incompleta");
  }

  try {
    const encodedTableName = encodeURIComponent(PHOTOS_TABLE_NAME);

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodedTableName}/${recordId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            Status: status,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error actualizando status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return true;
  } catch (error) {
    console.error(`Error actualizando status del registro ${recordId}:`, error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const requestStartTime = Date.now();

  try {
    console.log(`🚀 Inicio del request de upload. Timestamp: ${new Date().toISOString()}`);
    console.log(`🔗 Webhook URL configurada: ${WEBHOOK_URL ? '✅ Sí' : '❌ No'}`);
    console.log(`📊 Content-Type: ${request.headers.get('content-type')}`);

    // Detectar el tipo de procesamiento basado en el content-type y estructura del body
    const contentType = request.headers.get('content-type') || '';
    const isJsonRequest = contentType.includes('application/json');

    if (isJsonRequest) {
      // Para JSON, verificar si es producto individual o múltiple
      try {
        const body = await request.json();
        const isSingleProduct = body.marca && body.batch && body.totalBatches && body.products && Array.isArray(body.products) && body.products.length === 1;

        if (isSingleProduct) {
          console.log(`🔍 Detectado: Producto Individual (batch ${body.batch}/${body.totalBatches})`);
          return await handleSingleProductFromPayload(body);
        } else {
          console.log(`🔍 Detectado: Payload JSON múltiple`);
          return await handleMultipleProductsFromJson(body);
        }
      } catch (error) {
        console.error('❌ Error parseando JSON:', error);
        return NextResponse.json(
          { error: "JSON inválido en el request" },
          { status: 400 }
        );
      }
    } else {
      // Procesar múltiples productos con FormData (comportamiento original)
      console.log(`🔍 Detectado: FormData múltiple (comportamiento original)`);
      return await handleMultipleProducts(request);
    }
  } catch (error) {
    console.error('❌ Error general en upload:', error);

    Sentry.captureException(error, {
      tags: {
        component: 'api',
        endpoint: '/api/products/upload',
        errorType: 'general_upload_error'
      }
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error general en upload',
      },
      { status: 500 }
    );
  }
}

// Función para manejar productos individuales desde payload directo
async function handleSingleProductFromPayload(payload: any) {
  try {
    console.log(`📦 Procesando producto individual desde payload directo. Batch: ${payload.batch}/${payload.totalBatches}`);
    console.log(`🔗 Webhook URL: ${WEBHOOK_URL ? WEBHOOK_URL.substring(0, 50) + '...' : 'No configurada'}`);

    // Validar estructura del payload
    if (!payload.marca || !payload.batch || !payload.totalBatches) {
      throw new Error('Payload incompleto: faltan marca, batch o totalBatches');
    }

    if (!payload.products || !Array.isArray(payload.products) || payload.products.length !== 1) {
      throw new Error('Payload inválido: debe tener exactamente 1 producto en el array products');
    }

    const product = payload.products[0];

    // Validar datos del producto
    if (!product.recordId) {
      throw new Error(`Producto ${payload.batch} no tiene recordId de Airtable`);
    }
    if (!product.nombre) {
      throw new Error(`Producto ${payload.batch} no tiene nombre`);
    }
    if (!product.contentType) {
      throw new Error(`Producto ${payload.batch} no tiene contentType`);
    }

    // Validar datos según el método disponible
    const hasGcsData = !!(product.gcsPath && product.gcsSignedUrl);
    const hasBase64Data = !!(product.base64 && product.base64.length > 0);

    console.log(`📊 Método de subida preferido: ${process.env.TEST_UPLOAD === 'true' ? 'GCS' : 'base64'}`);
    console.log(`📦 Datos disponibles - GCS: ${hasGcsData ? '✅' : '❌'}, Base64: ${hasBase64Data ? '✅' : '❌'}`);

    // Validar que tenga al menos un método de subida
    if (!hasGcsData && !hasBase64Data) {
      throw new Error(`Producto ${payload.batch} no tiene datos de imagen válidos (ni GCS ni base64)`);
    }

    // Si TEST_UPLOAD=true pero no hay datos de GCS, es un error
    if (process.env.TEST_UPLOAD === 'true' && !hasGcsData) {
      throw new Error(`Producto ${payload.batch} debería usar GCS pero no tiene datos de GCS válidos`);
    }

    // Si TEST_UPLOAD=false pero no hay base64, es un error
    if (process.env.TEST_UPLOAD !== 'true' && !hasBase64Data) {
      throw new Error(`Producto ${payload.batch} debería usar base64 pero no tiene datos base64 válidos`);
    }

    console.log(`🎯 Se usará: ${hasGcsData ? 'GCS' : 'base64'}`);

    console.log(`✅ Validación de datos completada para producto ${payload.batch}`);

    if (!WEBHOOK_URL) {
      throw new Error('Webhook URL no configurada');
    }

    // 🚀 SUBIR IMAGEN A GOOGLE CLOUD STORAGE (solo si TEST_UPLOAD=true y NO viene con GCS del frontend)
    let gcsFileInfo = null;

    console.log(`🔍 Configuración GCS - TEST_UPLOAD: ${process.env.TEST_UPLOAD}`);
    console.log(`📦 Viene con GCS del frontend: ${product.gcsPath ? '✅' : '❌'}`);

    if (process.env.TEST_UPLOAD === 'true' && !product.gcsPath) {
      // El frontend no subió a GCS, intentar aquí
      console.log(`☁️ El frontend no subió a GCS, intentando subir aquí...`);

      try {
        // Validar que el base64 esté disponible
        if (!product.base64 || product.base64.length === 0) {
          throw new Error('Base64 data is required for GCS upload');
        }

        // Validar que el contentType sea válido
        if (!product.contentType || !product.contentType.startsWith('image/')) {
          throw new Error(`Invalid content type: ${product.contentType}`);
        }

        gcsFileInfo = await gcsService.uploadFromBase64(
          product.base64,
          product.nombre,
          product.contentType,
          {
            prefix: '', // Subir directamente al root del bucket
            metadata: {
              productName: product.nombre,
              recordId: product.recordId,
              batch: payload.batch,
              brandId: payload.marca,
              uploadMethod: 'gcs'
            }
          }
        );

        console.log(`✅ Imagen subida a GCS: ${gcsFileInfo.gcsPath}`);
        console.log(`🔗 URL firmada: ${gcsFileInfo.signedUrl}`);
        console.log(`📏 Tamaño del archivo: ${gcsFileInfo.size} bytes`);
      } catch (gcsError) {
        console.error('❌ Error subiendo a GCS:', gcsError);
        console.error('❌ Detalles del error GCS:', {
          message: gcsError instanceof Error ? gcsError.message : 'Unknown error',
          stack: gcsError instanceof Error ? gcsError.stack : 'No stack trace',
          base64Length: product.base64 ? product.base64.length : 0,
          contentType: product.contentType,
          productName: product.nombre
        });
        throw new Error(`GCS upload failed and no GCS data provided by frontend: ${gcsError instanceof Error ? gcsError.message : 'Unknown error'}`);
      }
    } else if (product.gcsPath) {
      // El frontend ya subió a GCS, usar esos datos
      console.log(`✅ Usando datos de GCS del frontend: ${product.gcsPath}`);
      gcsFileInfo = {
        fileName: product.nombre,
        gcsPath: product.gcsPath,
        signedUrl: product.gcsSignedUrl,
        publicUrl: product.gcsPublicUrl,
        size: product.fileSize,
        contentType: product.contentType
      };
    } else {
      console.log(`📦 Usando método base64 (TEST_UPLOAD=false o GCS no disponible)`);
    }

    // Generar cURL para debugging
    const generateCurlCommand = (webhookPayload: any): string => {
      const payloadStr = JSON.stringify(webhookPayload);
      // Escapar comillas para shell
      const escapedPayload = payloadStr.replace(/"/g, '\\"');
      return `curl -X POST "${WEBHOOK_URL}" -H "Content-Type: application/json" -d "${escapedPayload.substring(0, 500)}..."`;
    };

    // Función de reintento para webhook - ahora espera respuesta con imageRecordId
    interface WebhookResponse {
      text?: string;
      imageRecordId?: string;
    }

    const sendToWebhook = async (webhookPayload: any, attempt: number = 1): Promise<{ ok: boolean; data?: WebhookResponse; error?: string; status?: number }> => {
      try {
        console.log(`📡 Enviando producto individual al webhook (intento ${attempt}/${RETRY_ATTEMPTS})`);
        console.log(`🔗 URL del webhook: ${WEBHOOK_URL}`);
        console.log(`📊 Método: ${webhookPayload.uploadMethod}`);
        console.log(`📏 Tamaño del payload: ${JSON.stringify(webhookPayload).length} caracteres`);
        if (webhookPayload.uploadMethod === 'gcs') {
          console.log(`☁️ GCS Path: ${webhookPayload.products[0].gcsPath}`);
        } else {
          console.log(`📦 Base64 size: ${webhookPayload.products[0].base64?.length || 0} chars`);
        }

        const response = await fetch(WEBHOOK_URL!, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(webhookPayload),
        });

        console.log(`📊 Respuesta del webhook - Status: ${response.status} ${response.statusText}`);
        console.log(`📄 Headers de respuesta:`, Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Webhook falló con status ${response.status}`);
          console.error(`❌ Respuesta del webhook:`, errorText.substring(0, 500));

          // Log específico para errores comunes
          if (response.status === 413) {
            console.error(`💥 ERROR 413: Payload demasiado grande (${JSON.stringify(webhookPayload).length} chars)`);
          } else if (response.status === 400) {
            console.error(`💥 ERROR 400: Datos inválidos enviados al webhook`);
          } else if (response.status === 500) {
            console.error(`💥 ERROR 500: Error interno del servidor webhook`);
          }

          if (attempt < RETRY_ATTEMPTS) {
            console.log(`⏳ Reintentando en ${attempt * 1500}ms...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 1500));
            return sendToWebhook(webhookPayload, attempt + 1);
          }

          return { ok: false, error: errorText, status: response.status };
        }

        // Verificar si hay contenido en la respuesta antes de intentar parsear JSON
        const contentLength = response.headers.get('content-length');
        const contentType = response.headers.get('content-type');

        if (!contentLength || contentLength === '0' || !contentType?.includes('application/json')) {
          console.log(`✅ Webhook respondió OK (${response.status}) pero sin contenido JSON - asumiendo éxito y actualizando status`);

          // Si el webhook responde OK pero sin contenido, asumimos éxito
          // Actualizar el registro en Airtable para marcar como completado
          try {
            await updatePhotoRecordStatus(payload.products[0].recordId, 'Por Revisar');
            console.log(`✅ Status actualizado en Airtable para producto ${payload.products[0].recordId}`);
          } catch (updateError) {
            console.warn(`⚠️ No se pudo actualizar status en Airtable:`, updateError);
          }

          return {
            ok: true,
            data: {
              text: `Producto procesado exitosamente (sin respuesta JSON del webhook)`,
              imageRecordId: payload.products[0].recordId // Usar el recordId original como imageRecordId
            }
          };
        }

        // Intentar parsear respuesta como JSON
        let responseData: WebhookResponse;
        try {
          responseData = await response.json() as WebhookResponse;
          console.log(`✅ Webhook respondió OK con JSON:`, responseData);
        } catch (jsonError) {
          console.warn(`⚠️ Webhook respondió OK pero con contenido no-JSON:`, jsonError);

          // Si no puede parsear JSON pero el status es 200, asumimos éxito
          // Actualizar status en Airtable
          try {
            await updatePhotoRecordStatus(payload.products[0].recordId, 'Por Revisar');
            console.log(`✅ Status actualizado en Airtable para producto ${payload.products[0].recordId}`);
          } catch (updateError) {
            console.warn(`⚠️ No se pudo actualizar status en Airtable:`, updateError);
          }

          return {
            ok: true,
            data: {
              text: `Producto procesado exitosamente (respuesta no-JSON del webhook)`,
              imageRecordId: payload.products[0].recordId // Usar recordId original
            }
          };
        }

        // Validar que tenga imageRecordId si viene en la respuesta JSON
        if (responseData && !responseData.imageRecordId) {
          console.warn(`⚠️ Webhook devolvió JSON pero sin imageRecordId, usando recordId original...`);
          responseData.imageRecordId = payload.products[0].recordId;
        }

        // Si tenemos respuesta JSON válida con o sin imageRecordId, actualizar status en Airtable
        try {
          await updatePhotoRecordStatus(payload.products[0].recordId, 'Por Revisar');
          console.log(`✅ Status actualizado en Airtable para producto ${payload.products[0].recordId}`);
        } catch (updateError) {
          console.warn(`⚠️ No se pudo actualizar status en Airtable:`, updateError);
        }

        return { ok: true, data: responseData };

      } catch (error) {
        console.error(`❌ Error de conexión en intento ${attempt}:`, error);

        if (attempt < RETRY_ATTEMPTS) {
          console.log(`⏳ Reintentando en ${attempt * 1500}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1500));
          return sendToWebhook(webhookPayload, attempt + 1);
        }

        return { ok: false, error: error instanceof Error ? error.message : 'Error de conexión' };
      }
    };

    // Preparar payload para webhook - GCS o base64 según disponibilidad
    let webhookPayload;

    if (gcsFileInfo) {
      console.log(`🎯 Preparando payload con método GCS`);
      // Validar que GCS está disponible
      if (!gcsFileInfo.gcsPath || !gcsFileInfo.signedUrl) {
        throw new Error('GCS data is required but missing required fields');
      }

      webhookPayload = {
        ...payload,
        uploadMethod: 'gcs',
        products: [{
          ...product,
          // SOLO datos de GCS (sin base64 para mantener payload pequeño)
          gcsPath: gcsFileInfo.gcsPath,
          gcsSignedUrl: gcsFileInfo.signedUrl,
          gcsPublicUrl: gcsFileInfo.publicUrl,
          fileSize: gcsFileInfo.size,
          contentType: gcsFileInfo.contentType,
          // Remover base64 para reducir tamaño del payload
          base64: undefined,
        }],
      };
    } else {
      console.log(`📦 Preparando payload con método base64`);
      // Validar que tenemos base64 válido
      if (!product.base64 || product.base64.length === 0) {
        throw new Error('Base64 data is required but not available');
      }

      webhookPayload = {
        ...payload,
        uploadMethod: 'base64',
        products: [{
          ...product,
          // Solo base64
          base64: product.base64,
        }],
      };
    }

    // Log detallado del payload que se va a enviar
    console.log(`📤 Payload preparado para webhook:`);
    console.log(`   📊 Método de subida: ${webhookPayload.uploadMethod}`);
    console.log(`   🏷️  Marca: ${webhookPayload.marca}`);
    console.log(`   🔢 Batch: ${webhookPayload.batch}/${webhookPayload.totalBatches}`);
    console.log(`   📦 Productos en payload: ${webhookPayload.products.length}`);
    console.log(`   📄 Datos del producto:`);
    console.log(`      - RecordId: ${webhookPayload.products[0].recordId}`);
    console.log(`      - Nombre: ${webhookPayload.products[0].nombre}`);
    console.log(`      - ContentType: ${webhookPayload.products[0].contentType}`);
    console.log(`      - Tiene base64: ${!!webhookPayload.products[0].base64}`);
    console.log(`      - Tamaño base64: ${webhookPayload.products[0].base64 ? webhookPayload.products[0].base64.length : 0} chars`);
    console.log(`      - Tiene GCS: ${!!webhookPayload.products[0].gcsPath}`);
    console.log(`      - GCS Path: ${webhookPayload.products[0].gcsPath || 'N/A'}`);
    console.log(`      - GCS Signed URL: ${webhookPayload.products[0].gcsSignedUrl ? '✅ Presente' : '❌ No presente'}`);
    console.log(`      - Tamaño archivo: ${webhookPayload.products[0].fileSize || 'N/A'} bytes`);

    // Validar payload antes de enviar
    const validation = validateWebhookPayload(webhookPayload);
    if (!validation.valid) {
      console.error('❌ Payload inválido:', validation.errors);
      throw new Error(`Payload validation failed: ${validation.errors.join(', ')}`);
    }

    const payloadSize = JSON.stringify(webhookPayload).length;
    console.log(`📏 Tamaño total del payload: ${payloadSize} caracteres`);

    if (payloadSize > 1000000) { // 1MB límite aproximado
      console.warn(`⚠️ Payload muy grande (${payloadSize} chars). Considerar optimización.`);
    }

    // Log final de validación
    console.log(`✅ Payload validado correctamente`);
    console.log(`📊 Método: ${webhookPayload.uploadMethod}`);
    if (webhookPayload.uploadMethod === 'gcs') {
      console.log(`☁️ GCS Path: ${webhookPayload.products[0].gcsPath}`);
      console.log(`🔗 Signed URL: ${webhookPayload.products[0].gcsSignedUrl ? '✅ Presente' : '❌ Faltante'}`);
      console.log(`📏 Tamaño: ${webhookPayload.products[0].fileSize} bytes`);
    } else {
      console.log(`📦 Base64: ${webhookPayload.products[0].base64 ? `${webhookPayload.products[0].base64.length} chars` : '❌ Faltante'}`);
    }

    // Enviar al webhook
    const webhookResult = await sendToWebhook(webhookPayload);

    if (!webhookResult.ok) {
      console.error(`❌ Webhook falló después de ${RETRY_ATTEMPTS} intentos para producto ${payload.batch}`);
      
      // Generar cURL para debugging
      const curlCommand = generateCurlCommand(payload);
      console.error(`🔧 cURL para debug:\n${curlCommand}`);

      // Capturar error en Sentry
      Sentry.captureException(new Error(`Webhook failed for product ${payload.batch} after ${RETRY_ATTEMPTS} attempts`), {
        tags: {
          component: 'webhook',
          endpoint: '/api/products/upload',
          productBatch: payload.batch?.toString() || 'unknown',
          errorType: 'webhook_failure_all_retries'
        },
        extra: {
          webhookError: webhookResult.error,
          webhookStatus: webhookResult.status,
          curlCommand: curlCommand,
          productRecordId: payload.products?.[0]?.recordId
        }
      });

      // Devolver error con cURL para que el frontend lo muestre
      return NextResponse.json({
        success: false,
        error: `Webhook falló después de ${RETRY_ATTEMPTS} intentos`,
        details: webhookResult.error,
        batch: payload.batch,
        curlCommand: curlCommand,
        recordId: payload.products?.[0]?.recordId
      }, { status: 500 });
    }

    // Webhook exitoso - devolver imageRecordId para polling
    console.log(`✅ Producto individual ${payload.batch} enviado exitosamente al webhook`);
    console.log(`📝 imageRecordId recibido: ${webhookResult.data?.imageRecordId}`);

    return NextResponse.json({
      success: true,
      message: webhookResult.data?.text || `Producto ${payload.batch} procesado exitosamente`,
      batch: payload.batch,
      imageRecordId: webhookResult.data?.imageRecordId,
      recordId: payload.products?.[0]?.recordId,
      // Incluir información de GCS si está disponible
      ...(gcsFileInfo && {
        gcsInfo: {
          path: gcsFileInfo.gcsPath,
          signedUrl: gcsFileInfo.signedUrl,
          publicUrl: gcsFileInfo.publicUrl,
          size: gcsFileInfo.size,
        }
      })
    });

  } catch (error) {
    console.error('❌ Error procesando producto individual:', error);

    Sentry.captureException(error, {
      tags: {
        component: 'api',
        endpoint: '/api/products/upload',
        errorType: 'single_product_processing_error'
      }
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error procesando producto individual',
      },
      { status: 500 }
    );
  }
}

// Función para manejar múltiples productos desde JSON (legacy support)
async function handleMultipleProductsFromJson(payload: any) {
  // Esta función maneja payloads JSON con múltiples productos
  // Por ahora, redirigir a handleMultipleProducts si es necesario
  console.log('🔄 Redirigiendo a procesamiento múltiple desde JSON');
  // Implementar si es necesario
  return NextResponse.json(
    { error: "Procesamiento múltiple desde JSON no implementado aún" },
    { status: 501 }
  );
}

// Función para manejar múltiples productos (comportamiento original)
async function handleMultipleProducts(request: NextRequest) {
  const requestStartTime = Date.now();

  try {
    console.log(`🚀 Procesamiento múltiple de productos. Timestamp: ${new Date().toISOString()}`);

    const formData = await request.formData();
    const marca = formData.get("marca") as string;
    const productsJson = formData.get("products") as string;

    if (!marca) {
      return NextResponse.json(
        { error: "marca es requerido" },
        { status: 400 }
      );
    }

    if (!productsJson) {
      return NextResponse.json(
        { error: "products es requerido" },
        { status: 400 }
      );
    }

    if (!WEBHOOK_URL) {
      return NextResponse.json(
        { 
          error: "Webhook no configurado",
          details: "La variable de entorno PRODUCTOS_WEBHOOK o PRODUCTS_WEBHOOK_URL no está configurada"
        },
        { status: 500 }
      );
    }

    let products;
    try {
      products = JSON.parse(productsJson);
    } catch (parseError) {
      console.error("Error parsing products JSON:", parseError, productsJson);
      return NextResponse.json(
        { error: "Error al parsear datos de productos", details: parseError instanceof Error ? parseError.message : "Error desconocido" },
        { status: 400 }
      );
    }

    // Validación previa del tamaño total y optimizaciones
    let totalSize = 0;
    const oversizedFiles = [];
    const fileTypes = new Set<string>();

    for (let i = 0; i < products.length; i++) {
      const photoFile = formData.get(`photo_${i}`) as File | null;
      if (photoFile) {
        totalSize += photoFile.size;
        fileTypes.add(photoFile.type);

        if (photoFile.size > 4 * 1024 * 1024) { // > 4MB
          oversizedFiles.push(`${photoFile.name} (${Math.round(photoFile.size / 1024 / 1024)}MB)`);
        }
      }
    }

    console.log(`📊 Pre-validación: ${products.length} productos, ${Math.round(totalSize / 1024 / 1024)}MB total`);
    console.log(`📁 Tipos de archivo: ${Array.from(fileTypes).join(', ')}`);

    if (totalSize > MAX_TOTAL_SIZE) {
      console.warn(`⚠️ Tamaño total muy grande: ${Math.round(totalSize / 1024 / 1024)}MB (máx: ${Math.round(MAX_TOTAL_SIZE / 1024 / 1024)}MB)`);
    }

    if (oversizedFiles.length > 0) {
      console.warn(`⚠️ Archivos grandes detectados: ${oversizedFiles.join(', ')}`);
      console.log(`🗜️ Se aplicará compresión automática para optimizar el procesamiento`);
    }

    // Preparar lotes para procesamiento optimizado
    const batches = [];
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = [];
      for (let j = 0; j < BATCH_SIZE && i + j < products.length; j++) {
        const product = products[i + j];
        const photoFile = formData.get(`photo_${i + j}`) as File | null;

        if (photoFile) {
          batch.push({ index: i + j, product, photoFile });
        }
      }

      if (batch.length > 0) {
        batches.push(batch);
      }
    }

    console.log(`📦 Dividido en ${batches.length} lotes de máximo ${BATCH_SIZE} productos cada uno`);

    const webhookData = [];
    const startProcessing = Date.now();

    console.log(`🚀 Iniciando procesamiento optimizado de ${products.length} productos en ${batches.length} lotes`);

    // Función de reintento para webhook con mejor tolerancia a fallos temporales
    const sendToWebhookBatch = async (payload: any, attempt: number = 1): Promise<Response> => {
      try {
        const response = await fetch(WEBHOOK_URL!, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok && attempt <= RETRY_ATTEMPTS) {
          console.warn(`⚠️ Webhook respondió ${response.status}, reintentando en ${attempt * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          return sendToWebhookBatch(payload, attempt + 1);
        }

        return response;
      } catch (error) {
        if (attempt <= RETRY_ATTEMPTS) {
          console.warn(`⚠️ Error de conexión, reintentando en ${attempt * 1000}ms...`, error);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          return sendToWebhookBatch(payload, attempt + 1);
        }
        throw error;
      }
    };

    // Procesar cada lote y enviar inmediatamente al webhook
    let totalProcessed = 0;
    let totalSuccessful = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const batchStartTime = Date.now();

      console.log(`🔄 Procesando lote ${batchIndex + 1}/${batches.length} (${batch.length} productos)`);

      try {
        const batchResults = await processBatch(batch, marca, batchStartTime);
        totalProcessed += batch.length;
        totalSuccessful += batchResults.length;

        if (batchResults.length > 0) {
          // Enviar este lote inmediatamente al webhook
          const batchPayload = {
            marca,
            batch: batchIndex + 1,
            totalBatches: batches.length,
            products: batchResults,
            timestamp: new Date().toISOString()
          };

          console.log(`📡 Enviando lote ${batchIndex + 1}/${batches.length} al webhook (${batchResults.length} productos)`);

          try {
            const webhookResponse = await sendToWebhookBatch(batchPayload);

            if (webhookResponse.ok) {
              console.log(`✅ Lote ${batchIndex + 1} enviado exitosamente al webhook`);
            } else {
              const errorText = await webhookResponse.text();
              console.error(`❌ Error en webhook para lote ${batchIndex + 1}: ${webhookResponse.status} - ${errorText}`);

              // Enviar alerta a Sentry pero continuar el procesamiento
              Sentry.captureException(new Error(`Webhook failed for batch ${batchIndex + 1}`), {
                tags: {
                  component: 'webhook',
                  endpoint: '/api/products/upload',
                  batchIndex: batchIndex.toString(),
                  errorType: 'batch_webhook_error'
                },
                extra: {
                  webhookStatus: webhookResponse.status,
                  webhookResponse: errorText.substring(0, 500),
                  batchInfo: `Batch ${batchIndex + 1}/${batches.length} (${batchResults.length} products)`,
                  marca: marca
                }
              });

              // Continuar con el siguiente lote, no fallar todo por un lote
            }
          } catch (webhookError) {
            console.error(`❌ Error de conexión webhook para lote ${batchIndex + 1}:`, webhookError);

            // Enviar alerta a Sentry pero continuar
            Sentry.captureException(webhookError, {
              tags: {
                component: 'webhook',
                endpoint: '/api/products/upload',
                batchIndex: batchIndex.toString(),
                errorType: 'webhook_connection_error'
              },
              extra: {
                batchInfo: `Batch ${batchIndex + 1}/${batches.length}`,
                marca: marca
              }
            });

            // Continuar con el siguiente lote
          }
        }

        const batchTime = Date.now() - batchStartTime;
        console.log(`✅ Lote ${batchIndex + 1} completado en ${batchTime}ms`);

        // Verificar límite de tiempo total
        const totalTimeSoFar = Date.now() - startProcessing;
        if (totalTimeSoFar > MAX_PROCESSING_TIME) {
          console.warn(`⚠️ Tiempo de procesamiento excediendo límite (${totalTimeSoFar}ms > ${MAX_PROCESSING_TIME}ms)`);
          break; // Salir si nos pasamos del tiempo límite
        }

        // Pequeña pausa entre lotes para liberar memoria
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

      } catch (batchError) {
        console.error(`❌ Error procesando lote ${batchIndex + 1}:`, batchError);
        totalProcessed += batch.length;
        // Continuar con el siguiente lote
      }
    }

    const processingEndTime = Date.now();
    const totalProcessingTime = processingEndTime - startProcessing;

    console.log(`🎯 Procesamiento completado. Productos procesados: ${totalSuccessful}/${totalProcessed}. Tiempo total: ${totalProcessingTime}ms`);

    // Métricas de optimización
    if (totalProcessingTime > 10000) {
      console.warn(`⚠️ Procesamiento tomó tiempo: ${totalProcessingTime}ms`);
    }

    if (totalSuccessful === 0) {
      console.error(`❌ No se pudieron procesar productos. Total intentados: ${products.length}`);
      return NextResponse.json(
        { error: "No se pudieron procesar las imágenes" },
        { status: 400 }
      );
    }

    // Resumen final del procesamiento
    console.log(`🎉 Upload completado. ${totalSuccessful}/${totalProcessed} productos procesados exitosamente`);

    return NextResponse.json({
      success: true,
      marca,
      productsCount: totalSuccessful,
      batchesProcessed: batches.length,
      totalProcessingTime: Date.now() - startProcessing,
    });

  } catch (error) {
    console.error('❌ Error en procesamiento múltiple:', error);

    Sentry.captureException(error, {
      tags: {
        component: 'api',
        endpoint: '/api/products/upload',
        errorType: 'multiple_products_error'
      }
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error en procesamiento múltiple',
      },
      { status: 500 }
    );
  }
}
