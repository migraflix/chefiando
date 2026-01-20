import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { sanitizeString, sanitizeFileName } from "@/lib/airtable/utils";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const PHOTOS_TABLE_NAME = "Fotos AI";
const WEBHOOK_URL = process.env.PRODUCTOS_WEBHOOK || process.env.PRODUCTS_WEBHOOK_URL;

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
  try {
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

    const webhookData = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const photoFile = formData.get(`photo_${i}`) as File | null;

      if (!photoFile) {
        console.warn(`Producto ${i}: No se encontró archivo de foto`);
        continue;
      }

      let photoRecordId: string | null = null;
      try {
        photoRecordId = await createPhotoRecordInAirtable(product, marca);
      } catch (error) {
        console.error(`Error creando registro en Airtable para producto ${i}:`, error);
        continue;
      }

      if (!photoRecordId) {
        console.warn(`Producto ${i}: No se pudo crear registro en Airtable`);
        continue;
      }

      try {
        // Validar que los datos del producto sean seguros para JSON
        const sanitizedNombre = sanitizeString(product.name);
        const sanitizedDescripcion = sanitizeString(product.description);
        const sanitizedTags = product.tags.map(tag => sanitizeString(tag)).filter(tag => tag && tag.length > 0);

        // Verificar que los datos sanitizados sean válidos para JSON
        JSON.stringify({
          nombre: sanitizedNombre,
          descripcion: sanitizedDescripcion,
          precio: product.price || null,
          tags: sanitizedTags,
        });

        const buffer = await photoFile.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString("base64");
        const contentType = photoFile.type || "image/jpeg";

        // Verificar que el base64 sea válido
        if (!base64Data || base64Data.length === 0) {
          console.error(`Producto ${i}: Error convirtiendo imagen a base64`);
          continue;
        }

        webhookData.push({
          recordId: photoRecordId,
          nombre: sanitizeFileName(photoFile.name),
          contentType: contentType,
          base64: base64Data,
          datosProducto: {
            nombre: sanitizedNombre,
            descripcion: sanitizedDescripcion,
            precio: product.price || null,
            tags: sanitizedTags,
          },
        });

        console.log(`Producto ${i} procesado correctamente: ${sanitizedNombre}`);
      } catch (processingError) {
        console.error(`Error procesando producto ${i}:`, processingError, {
          nombre: product.name,
          descripcionLength: product.description?.length,
          tagsCount: product.tags?.length,
          precio: product.price,
        });
        continue;
      }
    }

    if (webhookData.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron productos con imágenes" },
        { status: 400 }
      );
    }

    let webhookPayload;
    try {
      webhookPayload = {
        marca,
        products: webhookData,
      };

      // Validar que el payload completo sea serializable a JSON
      const payloadString = JSON.stringify(webhookPayload);
      console.log(`Payload validado correctamente. Tamaño: ${payloadString.length} caracteres, Productos: ${webhookData.length}`);

    } catch (jsonError) {
      console.error("Error al crear payload JSON:", jsonError, {
        marca,
        productsCount: webhookData.length,
        productSample: webhookData[0] ? {
          recordId: webhookData[0].recordId,
          nombre: webhookData[0].nombre,
          contentType: webhookData[0].contentType,
          base64Length: webhookData[0].base64?.length,
          datosProducto: {
            nombre: webhookData[0].datosProducto?.nombre,
            descripcionLength: webhookData[0].datosProducto?.descripcion?.length,
            precio: webhookData[0].datosProducto?.precio,
            tagsCount: webhookData[0].datosProducto?.tags?.length,
          }
        } : null
      });

      Sentry.captureException(jsonError, {
        tags: {
          route: '/api/products/upload',
          method: 'POST',
          component: 'api',
          errorType: 'JSON_SERIALIZATION_ERROR'
        },
        extra: {
          message: "Error al serializar payload JSON para webhook",
          marca,
          productsCount: webhookData.length,
          originalError: jsonError instanceof Error ? jsonError.message : "Error desconocido"
        }
      });

      return NextResponse.json(
        {
          error: "Error al preparar datos para envío",
          details: {
            errorType: "JSON_SERIALIZATION_ERROR",
            message: jsonError instanceof Error ? jsonError.message : "Error desconocido",
            productsCount: webhookData.length,
          }
        },
        { status: 500 }
      );
    }

    let webhookResponse;
    try {
      webhookResponse = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
      });
    } catch (fetchError) {
      console.error("Error en fetch al webhook:", fetchError);
      Sentry.captureException(fetchError, {
        tags: {
          route: '/api/products/upload',
          method: 'POST',
          component: 'api',
          errorType: 'FETCH_ERROR'
        },
        extra: {
          message: "Error de conexión con webhook externo",
          webhookUrl: WEBHOOK_URL,
          productsCount: webhookData.length,
          marca
        }
      });
      return NextResponse.json(
        {
          error: "Error de conexión con el webhook",
          details: {
            errorType: "FETCH_ERROR",
            message: fetchError instanceof Error ? fetchError.message : "Error desconocido",
            webhookUrl: WEBHOOK_URL,
          }
        },
        { status: 500 }
      );
    }

    if (!webhookResponse.ok) {
      let errorText;
      try {
        errorText = await webhookResponse.text();
      } catch (textError) {
        errorText = "No se pudo leer la respuesta del error";
      }

      console.error("Error en respuesta del webhook:", {
        status: webhookResponse.status,
        statusText: webhookResponse.statusText,
        errorText,
        webhookUrl: WEBHOOK_URL,
        payloadSize: JSON.stringify(webhookPayload).length,
        productsCount: webhookData.length,
      });

      Sentry.captureException(new Error(`Webhook error: ${webhookResponse.status} ${webhookResponse.statusText}`), {
        tags: {
          route: '/api/products/upload',
          method: 'POST',
          component: 'api',
          errorType: 'WEBHOOK_ERROR'
        },
        extra: {
          message: "Error en respuesta del webhook externo",
          status: webhookResponse.status,
          statusText: webhookResponse.statusText,
          webhookError: errorText,
          webhookUrl: WEBHOOK_URL,
          payloadSize: JSON.stringify(webhookPayload).length,
          productsCount: webhookData.length,
          marca
        }
      });

      return NextResponse.json(
        {
          error: "Error al enviar datos al webhook",
          details: {
            status: webhookResponse.status,
            statusText: webhookResponse.statusText,
            webhookError: errorText,
            webhookUrl: WEBHOOK_URL,
            payloadSize: JSON.stringify(webhookPayload).length,
            productsCount: webhookData.length,
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      marca,
      productsCount: webhookData.length,
    });
  } catch (error) {
    console.error("Error general procesando productos:", error);
    Sentry.captureException(error, {
      tags: {
        route: '/api/products/upload',
        method: 'POST',
        component: 'api'
      },
      extra: {
        message: "Error general en procesamiento de productos con imágenes"
      }
    });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error al procesar los productos",
      },
      { status: 500 }
    );
  }
}
