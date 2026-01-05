"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import * as Sentry from "@sentry/nextjs";

export default function SentryExamplePage() {
  const [errorTriggered, setErrorTriggered] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const triggerError = () => {
    try {
      setErrorTriggered(true);
      setErrorMessage(null);
      
      // Generar un error de prueba con información única
      const uniqueError = new Error("Test error para Sentry - " + new Date().toISOString());
      
      // Agregar contexto adicional
      Sentry.setContext("test_context", {
        page: "sentry-example-page",
        timestamp: new Date().toISOString(),
        user_action: "button_click"
      });
      
      // Capturar el error con Sentry
      Sentry.captureException(uniqueError);
      
      // Forzar el envío inmediato
      Sentry.flush(2000).then(() => {
        console.log("✅ Error enviado a Sentry");
      });
      
      setErrorMessage(uniqueError.message);
      
      // También mostrar en consola
      console.error("Error capturado por Sentry:", uniqueError);
      console.log("Esperando confirmación de envío...");
    } catch (error) {
      console.error("Error al capturar:", error);
      setErrorMessage("Error al capturar: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const triggerUndefinedFunction = () => {
    try {
      setErrorTriggered(true);
      setErrorMessage(null);
      
      // Agregar contexto
      Sentry.setContext("test_context", {
        page: "sentry-example-page",
        test_type: "undefined_function",
        timestamp: new Date().toISOString()
      });
      
      // Llamar a una función que no existe
      // @ts-ignore - Esto es intencional para probar Sentry
      myUndefinedFunction();
    } catch (error) {
      Sentry.captureException(error);
      
      // Forzar el envío inmediato
      Sentry.flush(2000).then(() => {
        console.log("✅ Error enviado a Sentry");
      });
      
      setErrorMessage(error instanceof Error ? error.message : "Error: función no definida");
      console.error("Error capturado por Sentry:", error);
      console.log("Esperando confirmación de envío...");
    }
  };

  const triggerAsyncError = async () => {
    try {
      setErrorTriggered(true);
      setErrorMessage(null);
      
      // Simular un error asíncrono
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error("Error asíncrono de prueba - " + new Date().toISOString()));
        }, 100);
      });
    } catch (error) {
      Sentry.captureException(error);
      setErrorMessage(error instanceof Error ? error.message : "Error asíncrono desconocido");
      console.error("Error asíncrono capturado por Sentry:", error);
    }
  };

  const sendCustomMessage = () => {
    Sentry.captureMessage("Mensaje de prueba desde Sentry Example Page", "info");
    setErrorMessage("Mensaje enviado a Sentry (no es un error)");
    setErrorTriggered(true);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Página de Prueba de Sentry
          </CardTitle>
          <CardDescription>
            Usa los botones de abajo para generar diferentes tipos de errores y verificar que Sentry los capture correctamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estado */}
          <div className="p-4 rounded-lg bg-muted">
            <div className="flex items-center gap-2 mb-2">
              {errorTriggered ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Error enviado a Sentry</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-gray-400" />
                  <span className="font-medium">Ningún error generado aún</span>
                </>
              )}
            </div>
            {errorMessage && (
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Mensaje:</strong> {errorMessage}
              </p>
            )}
          </div>

          {/* Instrucciones */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold mb-2">📋 Instrucciones para Enviar el Primer Error:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <strong>Haz clic en cualquiera de los botones de abajo</strong> (recomendado: "⚠️ Llamar Función No Definida")
              </li>
              <li>
                <strong>Abre la consola del navegador (F12)</strong> y busca el mensaje: "✅ Error enviado a Sentry"
              </li>
              <li>
                <strong>Espera 5-10 segundos</strong> (los errores pueden tardar un momento en llegar)
              </li>
              <li>
                <strong>Ve a tu dashboard de Sentry:</strong>{" "}
                <a 
                  href="https://sentry.io/organizations/migraflix/issues/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Ver Issues en Sentry
                </a>
              </li>
              <li>
                <strong>Recarga la página de Sentry</strong> si no ves el error inmediatamente
              </li>
            </ol>
            <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900 rounded text-xs">
              <strong>💡 Tip:</strong> Si no ves el error después de 30 segundos, verifica en la consola del navegador (F12 → Network) que haya un request exitoso a "ingest.sentry.io"
            </div>
          </div>

          {/* Botón Principal Recomendado por Sentry */}
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border-2 border-green-500">
            <h3 className="font-semibold mb-2 text-green-800 dark:text-green-200">
              ✅ Botón Recomendado por Sentry (Para el Primer Error)
            </h3>
            <Button
              onClick={triggerUndefinedFunction}
              variant="destructive"
              size="lg"
              className="w-full text-lg py-6"
            >
              ⚠️ Llamar myUndefinedFunction() - PRIMER ERROR
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Este es el método que Sentry recomienda para verificar la configuración
            </p>
          </div>

          {/* Otros Botones de Prueba */}
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              onClick={triggerError}
              variant="destructive"
              className="w-full"
            >
              🚨 Generar Error Simple
            </Button>

            <Button
              onClick={triggerAsyncError}
              variant="destructive"
              className="w-full"
            >
              🔄 Generar Error Asíncrono
            </Button>

            <Button
              onClick={sendCustomMessage}
              variant="outline"
              className="w-full"
            >
              📨 Enviar Mensaje (No Error)
            </Button>
          </div>

          {/* Información adicional */}
          <div className="mt-6 p-4 rounded-lg bg-muted">
            <h3 className="font-semibold mb-2">ℹ️ Información:</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Los errores se envían automáticamente a Sentry</li>
              <li>
                <strong>📍 Ver errores en Sentry:</strong>{" "}
                <a 
                  href="https://sentry.io/organizations/migraflix/issues/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  https://sentry.io/organizations/migraflix/issues/
                </a>
              </li>
              <li>Los errores aparecen en 5-10 segundos después de generarlos</li>
              <li>Revisa la consola del navegador (F12) para ver los logs de debug</li>
            </ul>
          </div>

          {/* Guía rápida */}
          <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold mb-2">📖 Cómo Ver los Errores:</h3>
            <ol className="text-sm space-y-2 list-decimal list-inside">
              <li>Haz clic en el enlace de arriba o ve a Sentry manualmente</li>
              <li>Inicia sesión en tu cuenta de Sentry</li>
              <li>En el menú lateral izquierdo, haz clic en <strong>"Issues"</strong> (o "Problemas")</li>
              <li>Deberías ver una lista de errores, incluyendo los que generaste aquí</li>
              <li>Haz clic en cualquier error para ver detalles completos (stack trace, contexto, etc.)</li>
            </ol>
          </div>

          {/* Verificar configuración */}
          <div className="mt-4 p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">🔍 Verificar Configuración:</h3>
            <div className="text-sm space-y-1">
              <p>
                <strong>DSN Cliente:</strong>{" "}
                {process.env.NEXT_PUBLIC_SENTRY_DSN ? (
                  <span className="text-green-600">✅ Configurado</span>
                ) : (
                  <span className="text-red-600">❌ No configurado</span>
                )}
              </p>
              {!process.env.NEXT_PUBLIC_SENTRY_DSN && (
                <div className="mt-3 p-3 rounded bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                  <p className="font-semibold mb-2">🔑 Cómo Obtener el DSN:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>
                      Ve a:{" "}
                      <a 
                        href="https://sentry.io/organizations/migraflix/projects/migraflix/keys/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Sentry → Settings → Client Keys (DSN)
                      </a>
                    </li>
                    <li>Haz clic en "Show" o "Reveal" para ver el DSN completo</li>
                    <li>Copia el DSN (formato: <code>https://xxxxx@xxxxx.ingest.sentry.io/xxxxx</code>)</li>
                    <li>Agrégalo a tu archivo <code>.env.local</code> como:</li>
                  </ol>
                  <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                    <div>SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx</div>
                    <div>NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx</div>
                  </div>
                  <p className="text-xs mt-2 text-muted-foreground">
                    <strong>Nota:</strong> Ambas variables deben tener el mismo valor. Reinicia el servidor después de agregarlas.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

