import { NextRequest, NextResponse } from "next/server";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const CONTENT_TABLE_NAME = "Content";
const PHOTOS_TABLE_NAME = "Fotos AI";

const sanitize = (s: string) =>
  s.replace(/[^a-z0-9-_]+/gi, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "asset";

const extFromContentType = (ct: string, fallback: string) => {
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("gif")) return "gif";
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
  if (ct.includes("mp4")) return "mp4";
  if (ct.includes("quicktime")) return "mov";
  if (ct.includes("webm")) return "webm";
  return fallback;
};

async function findRecord(tableName: string, recordId: string) {
  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}/${recordId}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function pickImageUrl(record: any): string | null {
  const f = record?.fields ?? {};
  if (f["GCS Signed URL"]) return f["GCS Signed URL"];
  if (f["GCS Public URL"]) return f["GCS Public URL"];
  if (f["📥 Image"]?.[0]?.url) return f["📥 Image"][0].url;
  return null;
}

function pickVideoUrl(record: any): string | null {
  const f = record?.fields ?? {};
  if (f["📥 Video"]?.[0]?.url) return f["📥 Video"][0].url;
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  try {
    const { recordId } = await params;
    const type = (request.nextUrl.searchParams.get("type") || "image").toLowerCase();
    const check = request.nextUrl.searchParams.get("check") === "1";

    if (!recordId) {
      return NextResponse.json({ error: "Record ID is required" }, { status: 400 });
    }

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return NextResponse.json({ error: "Airtable no configurado" }, { status: 500 });
    }

    let record = await findRecord(CONTENT_TABLE_NAME, recordId);
    const hasAssetInContent = record && (type === "video" ? pickVideoUrl(record) : pickImageUrl(record));
    if (!hasAssetInContent) {
      record = (await findRecord(PHOTOS_TABLE_NAME, recordId)) ?? record;
    }

    if (check) {
      return NextResponse.json({
        hasImage: !!pickImageUrl(record),
        hasVideo: !!pickVideoUrl(record),
      });
    }

    const assetUrl = type === "video" ? pickVideoUrl(record) : pickImageUrl(record);
    if (!assetUrl) {
      return NextResponse.json(
        { error: type === "video" ? "Video no encontrado" : "Imagen no encontrada" },
        { status: 404 }
      );
    }

    const assetResponse = await fetch(assetUrl, {
      headers: { "User-Agent": "Migraflix/1.0" },
    });

    if (!assetResponse.ok) {
      return NextResponse.json(
        { error: "No se pudo descargar el archivo" },
        { status: 502 }
      );
    }

    const buffer = await assetResponse.arrayBuffer();
    const contentType =
      assetResponse.headers.get("content-type") ||
      (type === "video" ? "video/mp4" : "image/jpeg");
    const ext = extFromContentType(contentType, type === "video" ? "mp4" : "jpg");

    const title = record?.fields?.["Title"] || record?.fields?.["Nombre"] || recordId;
    const filename = `${sanitize(String(title))}_${recordId}.${ext}`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.byteLength.toString(),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Error en descarga:", error);
    return NextResponse.json(
      { error: "Error al descargar el archivo" },
      { status: 500 }
    );
  }
}
