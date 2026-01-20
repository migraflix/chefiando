import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const PHOTOS_TABLE_NAME = "Fotos AI";

/**
 * Endpoint auxiliar para crear registros individuales en Airtable
 * Usado cuando se procesa un producto por vez
 * Se usa para crear registros en la tabla de fotos de Airtable
 */
export async function POST(request: NextRequest) {
  try {
    const { productData, marca } = await request.json();

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      throw new Error("Configuración de Airtable incompleta");
    }

    const encodedTableName = encodeURIComponent(PHOTOS_TABLE_NAME);

    const fields: Record<string, any> = {
      Nombre: productData.name,
      Ingredientes: productData.description,
      Tags: productData.tags?.join(", ") || "",
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
      const errorText = await response.text();
      throw new Error(`Airtable error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      recordId: data.id
    });

  } catch (error) {
    console.error('Error creando registro en Airtable:', error);

    Sentry.captureException(error, {
      tags: {
        component: 'api',
        endpoint: '/api/products/create-record',
        errorType: 'airtable_record_creation'
      },
      extra: {
        productData: request.body,
        marca: request.nextUrl.searchParams.get('marca')
      }
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error creando registro',
      },
      { status: 500 }
    );
  }
}