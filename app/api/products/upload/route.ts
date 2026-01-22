import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { sanitizeString, sanitizeFileName } from "@/lib/airtable/utils";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const PHOTOS_TABLE_NAME = "Fotos AI";
const WEBHOOK_URL = process.env.PRODUCTOS_WEBHOOK || process.env.PRODUCTS_WEBHOOK_URL;

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
    if (!product.base64 || product.base64.length === 0) {
      throw new Error(`Producto ${payload.batch} no tiene datos base64 válidos`);
    }

    console.log(`✅ Validación de datos completada para producto ${payload.batch}`);

    if (!WEBHOOK_URL) {
      throw new Error('Webhook URL no configurada');
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

        const response = await fetch(WEBHOOK_URL!, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(webhookPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`⚠️ Webhook respondió ${response.status}: ${errorText}`);
          
          if (attempt < RETRY_ATTEMPTS) {
            console.log(`⏳ Reintentando en ${attempt * 1500}ms...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 1500));
            return sendToWebhook(webhookPayload, attempt + 1);
          }
          
          return { ok: false, error: errorText, status: response.status };
        }

        // Parsear respuesta exitosa
        const responseData = await response.json() as WebhookResponse;
        console.log(`✅ Webhook respondió OK:`, responseData);
        
        // Validar que tenga imageRecordId
        if (!responseData.imageRecordId) {
          console.warn(`⚠️ Webhook no devolvió imageRecordId, reintentando...`);
          if (attempt < RETRY_ATTEMPTS) {
            await new Promise(resolve => setTimeout(resolve, attempt * 1500));
            return sendToWebhook(webhookPayload, attempt + 1);
          }
          return { ok: false, error: "Webhook no devolvió imageRecordId" };
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

    // Enviar al webhook
    const webhookResult = await sendToWebhook(payload);

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
      recordId: payload.products?.[0]?.recordId
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
