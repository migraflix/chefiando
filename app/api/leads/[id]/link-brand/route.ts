import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { linkLeadToBrand } from "@/lib/airtable/leads";

const bodySchema = z.object({
  brandRecordId: z.string().regex(/^rec[a-zA-Z0-9]+$/, "brandRecordId inválido"),
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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.errors },
      { status: 400 }
    );
  }

  try {
    await linkLeadToBrand(id, parsed.data.brandRecordId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error linking lead to brand:", error);
    Sentry.captureException(error, {
      tags: { route: "/api/leads/[id]/link-brand", method: "PATCH" },
      extra: { leadId: id, brandRecordId: parsed.data.brandRecordId },
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al linkear el brand" },
      { status: 500 }
    );
  }
}
