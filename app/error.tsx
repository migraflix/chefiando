"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Using inline SVG for alert icon to avoid lucide-react version issues
import { useLanguage } from "@/contexts/language-context";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

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
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {isChunkError ? t.errorPage.oldVersion.title : t.errorPage.generic.title}
          </CardTitle>
          <CardDescription>
            {isChunkError
              ? t.errorPage.oldVersion.description
              : t.errorPage.generic.description}
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
              {isChunkError ? t.errorPage.oldVersion.button : t.errorPage.generic.button}
            </Button>
            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
            >
              {t.errorPage.generic.goHome}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

