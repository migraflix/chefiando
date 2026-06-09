import { NextRequest, NextResponse } from "next/server";
import { getLeadById } from "@/lib/airtable/leads";

export const dynamic = "force-dynamic";

/**
 * Route handler (no page) para tener control absoluto del redirect.
 * Reanuda el embudo desde donde el usuario lo dejo. n8n manda esta URL
 * en el follow-up para que retomen sin perder datos.
 *
 * Estados:
 *  - Lead         -> /registro con prefill
 *  - Registrando  -> /registro con prefill, o /fotos?marca=X si ya hay Brand
 *  - Cuenta abierta -> /fotos/gracias?marca=X
 *  - Lead inexistente o error -> /oportunidad
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const { leadId } = await params;
  const origin = new URL(request.url).origin;

  const fallback = () => NextResponse.redirect(new URL("/oportunidad", origin), 307);

  if (!leadId || !leadId.startsWith("rec")) {
    return fallback();
  }

  let lead;
  try {
    lead = await getLeadById(leadId);
  } catch (err) {
    console.error("[/retomar] getLeadById fallo:", err);
    return fallback();
  }

  if (!lead) {
    return fallback();
  }

  const fields = lead.fields;
  const status = typeof fields.Status === "string" ? fields.Status : "Lead";
  const brandLinks = Array.isArray(fields.Brand) ? fields.Brand : [];
  const brandId = typeof brandLinks[0] === "string" ? brandLinks[0] : undefined;

  if (status === "Cuenta abierta" && brandId) {
    return NextResponse.redirect(
      new URL(`/fotos/gracias?marca=${brandId}`, origin),
      307
    );
  }

  if (status === "Registrando" && brandId) {
    return NextResponse.redirect(new URL(`/fotos?marca=${brandId}`, origin), 307);
  }

  const qs = new URLSearchParams({ lead: leadId });
  if (typeof fields.Name === "string") qs.set("nombre", fields.Name);
  if (typeof fields.Negocio === "string") qs.set("negocio", fields.Negocio);
  if (typeof fields.Email === "string") qs.set("email", fields.Email);
  if (typeof fields.WhatsApp === "string") qs.set("whatsapp", fields.WhatsApp);

  return NextResponse.redirect(
    new URL(`/registro?${qs.toString()}`, origin),
    307
  );
}
