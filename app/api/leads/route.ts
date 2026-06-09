import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createLead } from "@/lib/airtable/leads";
import { leadSchema } from "@/lib/validation/lead-schema";

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Datos JSON inválidos" }, { status: 400 });
    }

    const validationResult = leadSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const origen = typeof body.origen === "string" ? body.origen : "Landing";
    const result = await createLead(validationResult.data, origen);

    return NextResponse.json({ success: true, recordId: result.recordId });
  } catch (error) {
    console.error("Error creating lead:", error);
    Sentry.captureException(error, {
      tags: { route: "/api/leads", method: "POST", component: "api" },
      extra: { message: "Error creating lead in Airtable" },
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear el lead" },
      { status: 500 }
    );
  }
}
