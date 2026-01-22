"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Detectar si es error de chunk loading (deploy nuevo mientras usuario tenía versión vieja)
  const isChunkError = error.message?.includes('chunk') || error.message?.includes('Loading chunk');

  useEffect(() => {
    // Capturar el error en Sentry automáticamente
    Sentry.captureException(error);
  }, [error]);

  // Para errores de chunk, hacer hard reload para cargar nueva versión
  const handleRetry = () => {
    if (isChunkError) {
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-6 w-6" />
            Algo salió mal
          </CardTitle>
          <CardDescription>
            Ha ocurrido un error inesperado. El error ha sido reportado automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm font-mono text-muted-foreground">
              {error.message || "Error desconocido"}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2">
                ID del error: {error.digest}
              </p>
            )}
          </div>
          <div className="flex gap-4">
            <Button onClick={handleRetry} variant="default">
              {isChunkError ? "Recargar página" : "Intentar de nuevo"}
            </Button>
            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
            >
              Volver al inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

