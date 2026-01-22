import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    // Solo devolver configuración no sensible
    const config = {
      TEST_UPLOAD: process.env.TEST_UPLOAD || 'false',
      GCS_BUCKET_NAME: process.env.GCS_BUCKET_NAME || 'no-configurado',
      GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || 'no-configurado',
      NODE_ENV: process.env.NODE_ENV || 'development'
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    return NextResponse.json(
      { error: 'Error obteniendo configuración' },
      { status: 500 }
    );
  }
}