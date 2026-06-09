import { redirect } from "next/navigation";
import { getLeadById } from "@/lib/airtable/leads";

type Props = {
  params: Promise<{ leadId: string }>;
};

/**
 * Reanuda el embudo desde donde el usuario lo dejó.
 * El n8n manda esta URL en el follow-up para que retomen sin perder datos.
 *
 * Estados:
 *  - Lead         -> /registro con prefill (todavia no llego al paso 2)
 *  - Registrando  -> /registro con prefill (estaba a medio llenar el form de Brand)
 *                    o /fotos?marca=X si ya tiene Brand linkeado (estaba en fotos)
 *  - Cuenta abierta -> ya termino: /fotos/gracias?marca=X
 *  - Sin lead     -> /oportunidad (lo mando a empezar)
 */
export default async function RetomarPage({ params }: Props) {
  const { leadId } = await params;

  if (!leadId || !leadId.startsWith("rec")) {
    redirect("/oportunidad");
  }

  let lead;
  try {
    lead = await getLeadById(leadId);
  } catch {
    redirect("/oportunidad");
  }

  if (!lead) {
    redirect("/oportunidad");
  }

  const fields = lead.fields;
  const status = typeof fields.Status === "string" ? fields.Status : "Lead";
  const brandLinks = Array.isArray(fields.Brand) ? fields.Brand : [];
  const brandId = typeof brandLinks[0] === "string" ? brandLinks[0] : undefined;

  if (status === "Cuenta abierta" && brandId) {
    redirect(`/fotos/gracias?marca=${brandId}`);
  }

  if (status === "Registrando" && brandId) {
    redirect(`/fotos?marca=${brandId}`);
  }

  const qs = new URLSearchParams({ lead: leadId });
  if (typeof fields.Name === "string") qs.set("nombre", fields.Name);
  if (typeof fields.Negocio === "string") qs.set("negocio", fields.Negocio);
  if (typeof fields.Email === "string") qs.set("email", fields.Email);
  if (typeof fields.WhatsApp === "string") qs.set("whatsapp", fields.WhatsApp);

  redirect(`/registro?${qs.toString()}`);
}
