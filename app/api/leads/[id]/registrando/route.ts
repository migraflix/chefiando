import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { markLeadRegistrando } from "@/lib/airtable/leads";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !id.startsWith("rec")) {
    return NextResponse.json({ error: "ID de lead inválido" }, { status: 400 });
  }

  try {
    await markLeadRegistrando(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking lead Registrando:", error);
    Sentry.captureException(error, {
      tags: { route: "/api/leads/[id]/registrando", method: "PATCH" },
      extra: { leadId: id },
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al actualizar el lead" },
      { status: 500 }
    );
  }
}
