import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { markLeadCuentaAbierta } from "@/lib/airtable/leads";

const completeSchema = z.object({
  brandRecordId: z
    .string()
    .regex(/^rec[a-zA-Z0-9]+$/, "brandRecordId inválido")
    .optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !id.startsWith("rec")) {
    return NextResponse.json({ error: "ID de lead inválido" }, { status: 400 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.errors },
      { status: 400 }
    );
  }

  try {
    await markLeadCuentaAbierta(id, parsed.data.brandRecordId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing lead:", error);
    Sentry.captureException(error, {
      tags: { route: "/api/leads/[id]/complete", method: "PATCH" },
      extra: { leadId: id, brandRecordId: parsed.data.brandRecordId },
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al completar el lead" },
      { status: 500 }
    );
  }
}
