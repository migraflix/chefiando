"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Info } from "lucide-react";
// Using inline SVG for alert icon
import { useState, useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function SentryDebugPage() {
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    // Verificar información del cliente de Sentry
    const info: any = {
      isInitialized: typeof Sentry !== 'undefined' && Sentry.getClient() !== null,
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || 'No configurado',
      hasDsn: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
      dsnLength: process.env.NEXT_PUBLIC_SENTRY_DSN?.length || 0,
      environment: process.env.NODE_ENV,
      client: Sentry.getClient() ? {
        getDsn: () => {
          try {
            const client = Sentry.getClient();
            return client?.getDsn?.()?.toString() || 'No disponible';
          } catch (e) {
            return 'Error al obtener DSN';
          }
        },
        getOptions: () => {
          try {
            const client = Sentry.getClient();
            return client?.getOptions?.() || {};
          } catch (e) {
            return {};
          }
        }
      } : null
    };
    setClientInfo(info);
  }, []);

  const testSentry = () => {
    try {
      const testError = new Error("Test de Sentry desde página de debug - " + new Date().toISOString());
      Sentry.captureException(testError);
      setTestResult("✅ Error enviado a Sentry. Revisa tu dashboard en unos segundos.");
    } catch (error) {
      setTestResult("❌ Error al enviar: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const checkDsnFormat = (dsn: string) => {
    if (!dsn) return { valid: false, error: "DSN vacío" };
    if (!dsn.startsWith("https://")) return { valid: false, error: "DSN debe empezar con https://" };
    if (!dsn.includes("@")) return { valid: false, error: "DSN debe contener @" };
    if (!dsn.includes(".ingest.")) return { valid: false, error: "DSN debe contener .ingest." };
    if (!dsn.includes(".sentry.io")) return { valid: false, error: "DSN debe contener .sentry.io" };
    return { valid: true };
  };

  const dsnCheck = clientInfo?.dsn ? checkDsnFormat(clientInfo.dsn) : { valid: false, error: "DSN no configurado" };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-6 w-6" />
            Debug de Sentry
          </CardTitle>
          <CardDescription>
            Verifica la configuración de Sentry y diagnostica problemas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estado de Inicialización */}
          <div className="p-4 rounded-lg border">
            <h3 className="font-semibold mb-3">🔧 Estado de Inicialización</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {clientInfo?.isInitialized ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Sentry está inicializado</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span>Sentry NO está inicializado</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {clientInfo?.hasDsn ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>DSN encontrado en variables de entorno</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span>DSN NO encontrado en variables de entorno</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Información del DSN */}
          <div className="p-4 rounded-lg border">
            <h3 className="font-semibold mb-3">🔑 Información del DSN</h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong>DSN (primeros 30 caracteres):</strong>{" "}
                <code className="bg-muted px-2 py-1 rounded">
                  {clientInfo?.dsn?.substring(0, 30) || "No configurado"}...
                </code>
              </div>
              <div>
                <strong>Longitud del DSN:</strong> {clientInfo?.dsnLength} caracteres
              </div>
              <div>
                <strong>Formato del DSN:</strong>{" "}
                {dsnCheck.valid ? (
                  <span className="text-green-600">✅ Válido</span>
                ) : (
                  <span className="text-red-600">❌ {dsnCheck.error}</span>
                )}
              </div>
              {clientInfo?.client && (
                <div>
                  <strong>DSN del Cliente:</strong>{" "}
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    {clientInfo.client.getDsn()}
                  </code>
                </div>
              )}
            </div>
          </div>

          {/* Variables de Entorno */}
          <div className="p-4 rounded-lg border">
            <h3 className="font-semibold mb-3">🌍 Variables de Entorno</h3>
            <div className="space-y-2 text-sm font-mono">
              <div>
                <strong>NODE_ENV:</strong> {clientInfo?.environment || "No disponible"}
              </div>
              <div>
                <strong>NEXT_PUBLIC_SENTRY_DSN:</strong>{" "}
                {clientInfo?.hasDsn ? (
                  <span className="text-green-600">✅ Configurada</span>
                ) : (
                  <span className="text-red-600">❌ No configurada</span>
                )}
              </div>
            </div>
          </div>

          {/* Prueba de Envío */}
          <div className="p-4 rounded-lg border">
            <h3 className="font-semibold mb-3">🧪 Prueba de Envío</h3>
            <button
              onClick={testSentry}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Enviar Error de Prueba a Sentry
            </button>
            {testResult && (
              <div className="mt-3 p-3 rounded bg-muted text-sm">
                {testResult}
              </div>
            )}
          </div>

          {/* Instrucciones */}
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
            <h3 className="font-semibold mb-2">📋 Pasos para Solucionar</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              {!clientInfo?.hasDsn && (
                <li>
                  Agrega <code>NEXT_PUBLIC_SENTRY_DSN</code> a tu archivo <code>.env.local</code>
                </li>
              )}
              {clientInfo?.hasDsn && !dsnCheck.valid && (
                <li>
                  El formato del DSN es incorrecto. Verifica que tenga el formato:{" "}
                  <code>https://xxxxx@xxxxx.ingest.sentry.io/xxxxx</code>
                </li>
              )}
              {clientInfo?.hasDsn && dsnCheck.valid && !clientInfo?.isInitialized && (
                <li>
                  El DSN está configurado pero Sentry no se inicializó. Reinicia el servidor:{" "}
                  <code>npm run dev</code>
                </li>
              )}
              <li>
                Abre la consola del navegador (F12) y busca mensajes de Sentry (deberían aparecer si debug está activado)
              </li>
              <li>
                Verifica que no haya errores en la consola relacionados con Sentry
              </li>
            </ol>
          </div>

          {/* Información del Cliente */}
          {clientInfo?.client && (
            <div className="p-4 rounded-lg border">
              <h3 className="font-semibold mb-3">⚙️ Opciones del Cliente</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                {JSON.stringify(clientInfo.client.getOptions(), null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

