import { NextRequest, NextResponse } from "next/server";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const CONTENT_TABLE_NAME = "Content";

interface ImageAnalysis {
  id: string;
  status: string;
  created: string;
  images: {
    airtable: boolean;
    gcs: {
      signed: boolean;
      public: boolean;
      path: boolean;
    };
    source: string;
  };
  urls: {
    airtable: string | null;
    gcsSigned: string | null;
    gcsPublic: string | null;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Obtener registros recientes de Content
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${CONTENT_TABLE_NAME}?sort%5B0%5D%5Bfield%5D=Created&sort%5B0%5D%5Bdirection%5D=desc&pageSize=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch content records' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const records = data.records || [];

    // Analizar cada registro
    const analysis: ImageAnalysis[] = records.map((record: any) => {
      const fields = record.fields;
      const hasAirtableImage = !!(fields["📥 Image"]?.[0]?.url);
      const hasGcsSigned = !!fields["GCS Signed URL"];
      const hasGcsPublic = !!fields["GCS Public URL"];
      const hasGcsPath = !!fields["GCS Path"];

      return {
        id: record.id,
        status: fields.Status,
        created: record.createdTime,
        images: {
          airtable: hasAirtableImage,
          gcs: {
            signed: hasGcsSigned,
            public: hasGcsPublic,
            path: hasGcsPath,
          },
          source: hasGcsSigned ? 'GCS' : hasAirtableImage ? 'Airtable' : 'None',
        },
        urls: {
          airtable: hasAirtableImage ? fields["📥 Image"][0].url.substring(0, 50) + '...' : null,
          gcsSigned: hasGcsSigned ? fields["GCS Signed URL"].substring(0, 50) + '...' : null,
          gcsPublic: hasGcsPublic ? fields["GCS Public URL"].substring(0, 50) + '...' : null,
        }
      };
    });

    // Estadísticas
    const stats = {
      total: records.length,
      withImages: analysis.filter(r => r.images.airtable || r.images.gcs.signed).length,
      fromAirtable: analysis.filter(r => r.images.airtable && !r.images.gcs.signed).length,
      fromGCS: analysis.filter(r => r.images.gcs.signed).length,
      withoutImages: analysis.filter(r => !r.images.airtable && !r.images.gcs.signed).length,
    };

    return NextResponse.json({
      success: true,
      stats,
      records: analysis,
      message: `Análisis de ${records.length} registros de Content`
    });

  } catch (error) {
    console.error('Error analyzing content images:', error);

    return NextResponse.json(
      {
        error: 'Error analyzing content images',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}