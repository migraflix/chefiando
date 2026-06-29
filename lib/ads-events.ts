// Helpers para disparar eventos de conversión en Meta Pixel + Google Ads + GTM.
// Si el pixel respectivo no está configurado o el script aún no cargó, el evento
// se ignora silenciosamente — no bloquea el flujo del usuario.

type EventName = "Lead" | "CompleteRegistration";

declare global {
  interface Window {
    fbq?: (action: string, event: string, params?: Record<string, unknown>) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: Record<string, unknown>[];
  }
}

const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const GOOGLE_ADS_LEAD_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL;
const GOOGLE_ADS_REGISTRATION_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_REGISTRATION_LABEL;

function trackMeta(event: EventName, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    window.fbq("track", event, params);
  } catch (err) {
    console.warn(`[ads] fbq ${event} failed`, err);
  }
}

function trackGoogleAds(event: EventName, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.gtag || !GOOGLE_ADS_ID) return;
  const label = event === "Lead" ? GOOGLE_ADS_LEAD_LABEL : GOOGLE_ADS_REGISTRATION_LABEL;
  if (!label) return;
  try {
    window.gtag("event", "conversion", {
      send_to: `${GOOGLE_ADS_ID}/${label}`,
      ...params,
    });
  } catch (err) {
    console.warn(`[ads] gtag ${event} failed`, err);
  }
}

function trackGtm(event: EventName, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.dataLayer) return;
  try {
    window.dataLayer.push({ event, ...params });
  } catch (err) {
    console.warn(`[ads] gtm ${event} failed`, err);
  }
}

export function trackLead(params?: Record<string, unknown>) {
  trackMeta("Lead", params);
  trackGoogleAds("Lead", params);
  trackGtm("Lead", params);
}

export function trackCompleteRegistration(params?: Record<string, unknown>) {
  trackMeta("CompleteRegistration", params);
  trackGoogleAds("CompleteRegistration", params);
  trackGtm("CompleteRegistration", params);
}
