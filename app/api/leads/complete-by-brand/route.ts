import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { findLeadByBrand, markLeadCuentaAbierta } from "@/lib/airtable/leads";

const bodySchema = z.object({
  brandRecordId: z.string().regex(/^rec[a-zA-Z0-9]+$/, "brandRecordId inválido"),
});

/**
 * Cierra el embudo: marca el Emprendedor (encontrado por el Brand linkeado)
 * como Status="Cuenta abierta". Llamado al final de /fotos/gracias.
 *
 * Si no existe lead linkeado (el usuario empezo registro directo sin pasar
 * por /oportunidad), devuelve success sin hacer nada — no es error.
 */
export async function POST(request: NextRequest) {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.errors },
      { status: 400 }
    );
  }

  try {
    const lead = await findLeadByBrand(parsed.data.brandRecordId);
    if (!lead) {
      return NextResponse.json({ success: true, leadFound: false });
    }
    await markLeadCuentaAbierta(lead.id, parsed.data.brandRecordId);
    return NextResponse.json({ success: true, leadFound: true, leadId: lead.id });
  } catch (error) {
    console.error("Error completing lead by brand:", error);
    Sentry.captureException(error, {
      tags: { route: "/api/leads/complete-by-brand", method: "POST" },
      extra: { brandRecordId: parsed.data.brandRecordId },
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al completar el lead" },
      { status: 500 }
    );
  }
}
