// Eventos de conversión para Meta Pixel. Si el script aún no cargó, se ignora.

declare global {
  interface Window {
    fbq?: (action: string, event: string, params?: Record<string, unknown>) => void;
  }
}

function track(event: "Lead" | "CompleteRegistration", params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    window.fbq("track", event, params);
  } catch (err) {
    console.warn(`[ads] fbq ${event} failed`, err);
  }
}

export function trackLead(params?: Record<string, unknown>) {
  track("Lead", params);
}

export function trackCompleteRegistration(params?: Record<string, unknown>) {
  track("CompleteRegistration", params);
}
