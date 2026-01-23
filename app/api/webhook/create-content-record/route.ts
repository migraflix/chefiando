import { NextRequest, NextResponse } from "next/server";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const CONTENT_TABLE_NAME = "Content";

/**
 * Endpoint para que el webhook cree registros en la tabla Content
 * antes de subir imágenes generadas
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productRecordId, marca, generatedContent, status = "Creando imagen" } = body;

    if (!productRecordId) {
      return NextResponse.json(
        { error: 'productRecordId is required' },
        { status: 400 }
      );
    }

    if (!marca) {
      return NextResponse.json(
        { error: 'marca (brand ID) is required' },
        { status: 400 }
      );
    }

    console.log(`📝 Creando registro en Content para producto ${productRecordId}`);

    // Preparar campos para el registro en Content
    const fields: Record<string, any> = {
      "Status": status,
      "Brand": [marca], // Relación con la marca
      "Producto Original": [productRecordId], // Relación con el producto original
    };

    // Agregar contenido generado si existe
    if (generatedContent) {
      if (generatedContent.post) {
        fields["Post"] = generatedContent.post;
      }
      if (generatedContent.title) {
        fields["Title"] = generatedContent.title;
      }
      if (generatedContent.prompt) {
        fields["Prompt Image"] = generatedContent.prompt;
      }
    }

    // Crear registro en Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${CONTENT_TABLE_NAME}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields,
          typecast: true,
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error creando registro en Content:`, errorText);
      return NextResponse.json(
        { error: 'Failed to create content record', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const contentRecordId = data.id;

    console.log(`✅ Registro en Content creado: ${contentRecordId} para producto ${productRecordId}`);

    return NextResponse.json({
      success: true,
      contentRecordId,
      message: 'Content record created successfully'
    });

  } catch (error) {
    console.error('❌ Error creando registro en Content:', error);

    return NextResponse.json(
      {
        error: 'Error creating content record',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}