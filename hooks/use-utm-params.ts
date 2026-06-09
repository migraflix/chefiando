"use client";

import { useEffect, useState } from "react";
import type { UtmParams } from "@/lib/validation/lead-schema";

const STORAGE_KEY = "chefiando_utm_attribution";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

// Click IDs por red: Meta usa fbclid, Google usa gclid, TikTok ttclid, etc.
const CLICK_ID_KEYS = ["fbclid", "gclid", "ttclid", "msclkid"] as const;

function readFromUrl(): UtmParams {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const out: UtmParams = {};

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) (out as Record<string, string>)[key] = value;
  }

  for (const key of CLICK_ID_KEYS) {
    const value = params.get(key);
    if (value) {
      out.click_id = `${key}=${value}`;
      break;
    }
  }

  if (window.location.pathname) out.landing_path = window.location.pathname;
  if (document.referrer) out.referrer = document.referrer;

  return out;
}

function loadFromStorage(): UtmParams | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UtmParams) : null;
  } catch {
    return null;
  }
}

function saveToStorage(utm: UtmParams) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utm));
  } catch {
    // Storage lleno o bloqueado: silencioso, no es crítico.
  }
}

/**
 * Captura UTMs y metadata de atribución para el lead.
 * Precedencia: URL actual > sessionStorage (last-touch dentro de la sesión).
 * Persiste en sessionStorage para que sobreviva /oportunidad -> /registro.
 */
export function useUtmParams(): UtmParams {
  const [utm, setUtm] = useState<UtmParams>({});

  useEffect(() => {
    const fromUrl = readFromUrl();
    const hasUrlUtm = UTM_KEYS.some((k) => fromUrl[k]) || fromUrl.click_id;

    if (hasUrlUtm) {
      saveToStorage(fromUrl);
      setUtm(fromUrl);
      return;
    }

    const fromStorage = loadFromStorage();
    if (fromStorage) {
      setUtm({
        ...fromStorage,
        landing_path: fromUrl.landing_path ?? fromStorage.landing_path,
        referrer: fromStorage.referrer ?? fromUrl.referrer,
      });
      return;
    }

    setUtm(fromUrl);
  }, []);

  return utm;
}
