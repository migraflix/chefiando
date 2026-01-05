"use client";

import { useEffect } from "react";

// Este componente asegura que Sentry se inicialice en el cliente
export function SentryInit() {
  useEffect(() => {
    // Importar dinámicamente la configuración del cliente
    import("../sentry.client.config").catch((error) => {
      console.error("[Sentry] Error al cargar configuración:", error);
    });
  }, []);

  return null; // Este componente no renderiza nada
}

