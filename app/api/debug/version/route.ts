import { NextResponse } from "next/server";
import { APP_VERSION, BUILD_DATE } from "@/lib/version";

export async function GET() {
  const webhookUrl = process.env.PRODUCTOS_WEBHOOK || process.env.PRODUCTS_WEBHOOK_URL;
  
  return NextResponse.json({
    version: APP_VERSION,
    buildDate: BUILD_DATE,
    serverTimestamp: new Date().toISOString(),
    webhookConfigured: !!webhookUrl,
    webhookUrlPreview: webhookUrl ? webhookUrl.substring(0, 40) + "..." : "NO CONFIGURADO",
    environment: process.env.NODE_ENV,
    vercelRegion: process.env.VERCEL_REGION || "local",
  });
}
