import { NextRequest, NextResponse } from "next/server";

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
      Nombre: productData.name,
      Ingredientes: productData.description,
      Tags: productData.tags.join(", "),
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

    const products = JSON.parse(productsJson);
    const webhookData = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const photoFile = formData.get(`photo_${i}`) as File | null;

      if (!photoFile) {
        continue;
      }

      let photoRecordId: string | null = null;
      try {
        photoRecordId = await createPhotoRecordInAirtable(product, marca);
      } catch (error) {
        continue;
      }

      if (!photoRecordId) {
        continue;
      }

      const buffer = await photoFile.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString("base64");
      const contentType = photoFile.type || "image/jpeg";

      webhookData.push({
        recordId: photoRecordId,
        nombre: photoFile.name,
        contentType: contentType,
        base64: base64Data,
        datosProducto: {
          nombre: product.name,
          descripcion: product.description,
          precio: product.price || null,
          tags: product.tags,
        },
      });
    }

    if (webhookData.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron productos con imágenes" },
        { status: 400 }
      );
    }

    const webhookPayload = {
      marca,
      products: webhookData,
    };

    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text().catch(() => "No se pudo leer el error");
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
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error al procesar los productos",
      },
      { status: 500 }
    );
  }
}
