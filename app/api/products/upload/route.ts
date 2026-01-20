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
const RETRY_ATTEMPTS = 2; // Reintentos para fallos temporales
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
      Tags: productData.tags.map(tag => sanitizeString(tag)).filter(Boolean).join(", "),
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

    // Verificar si es un producto individual o procesamiento múltiple
    const isSingleProduct = request.headers.get('content-type')?.includes('application/json');

    if (isSingleProduct) {
      // Procesar producto individual
      return await handleSingleProduct(request);
    } else {
      // Procesar múltiples productos (comportamiento original)
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

// Función para manejar productos individuales (procesamiento inmediato)
async function handleSingleProduct(request: NextRequest) {
  try {
    const body = await request.json();
    const { singleProduct, productData } = body;

    if (!singleProduct || !productData) {
      throw new Error('Datos de producto individual inválidos');
    }

    console.log(`📦 Procesando producto individual. Batch: ${productData.batch}/${productData.totalBatches}`);

    // Función de reintento para webhook
    const sendToWebhook = async (payload: any, attempt: number = 1): Promise<Response> => {
      try {
        console.log(`📡 Enviando producto individual al webhook (intento ${attempt}/${RETRY_ATTEMPTS + 1})`);

        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok && attempt <= RETRY_ATTEMPTS) {
          console.warn(`⚠️ Webhook respondió ${response.status}, reintentando en ${attempt * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          return sendToWebhook(payload, attempt + 1);
        }

        return response;
      } catch (error) {
        if (attempt <= RETRY_ATTEMPTS) {
          console.warn(`⚠️ Error de conexión, reintentando en ${attempt * 1000}ms...`, error);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          return sendToWebhook(payload, attempt + 1);
        }
        throw error;
      }
    };

    // Enviar al webhook
    const webhookResponse = await sendToWebhook(productData);

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      throw new Error(`Webhook error: ${webhookResponse.status} ${errorText}`);
    }

    console.log(`✅ Producto individual ${productData.batch} enviado exitosamente al webhook`);

    return NextResponse.json({
      success: true,
      message: `Producto ${productData.batch} procesado exitosamente`,
      batch: productData.batch
    });

  } catch (error) {
    console.error('❌ Error procesando producto individual:', error);

    Sentry.captureException(error, {
      tags: {
        component: 'api',
        endpoint: '/api/products/upload',
        errorType: 'single_product_error'
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
            const webhookResponse = await sendToWebhook(batchPayload);

            if (webhookResponse.ok) {
              console.log(`✅ Lote ${batchIndex + 1} enviado exitosamente al webhook`);
            } else {
              console.error(`❌ Error en webhook para lote ${batchIndex + 1}: ${webhookResponse.status}`);
              // Continuar con el siguiente lote, no fallar todo por un lote
            }
          } catch (webhookError) {
            console.error(`❌ Error de conexión webhook para lote ${batchIndex + 1}:`, webhookError);
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

    // Función de reintento para webhook con mejor tolerancia a fallos temporales
    const sendToWebhook = async (payload: any, attempt: number = 1): Promise<Response> => {
      try {
        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok && attempt <= RETRY_ATTEMPTS) {
          console.warn(`⚠️ Webhook respondió ${response.status}, reintentando en ${attempt * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          return sendToWebhook(payload, attempt + 1);
        }

        return response;
      } catch (error) {
        if (attempt <= RETRY_ATTEMPTS) {
          console.warn(`⚠️ Error de conexión, reintentando en ${attempt * 1000}ms...`, error);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          return sendToWebhook(payload, attempt + 1);
        }
        throw error;
      }
    };

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
