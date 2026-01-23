"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";

interface PermissionCheck {
  success: boolean;
  check: {
    timestamp: string;
    ip: string;
    userAgent: string;
    airtable: {
      configured: boolean;
      baseAccessible: boolean;
      photosTableAccessible: boolean;
      canCreateRecords: boolean;
      error?: string;
    };
    webhook: {
      configured: boolean;
      accessible: boolean;
      acceptsPost: boolean;
      error?: string;
    };
    environment: {
      nodeEnv: string;
      hasAirtableKey: boolean;
      hasAirtableBase: boolean;
      hasWebhookUrl: boolean;
    };
  };
  duration: number;
  message: string;
  error?: string;
}

export default function PermissionsPage() {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<PermissionCheck | null>(null);

  const checkPermissions = async () => {
    setIsChecking(true);
    setResult(null);

    try {
      console.log("🔐 Iniciando verificación de permisos...");

      const response = await fetch("/api/debug/permissions");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error en la verificación");
      }

      setResult(data);
      console.log("✅ Resultado de permisos:", data);

    } catch (error) {
      console.error("❌ Error en verificación de permisos:", error);
      setResult({
        success: false,
        check: {
          timestamp: new Date().toISOString(),
          ip: "unknown",
          userAgent: navigator.userAgent,
          airtable: {
            configured: false,
            baseAccessible: false,
            photosTableAccessible: false,
            canCreateRecords: false,
            error: error instanceof Error ? error.message : "Error desconocido"
          },
          webhook: {
            configured: false,
            accessible: false,
            acceptsPost: false,
            error: "No se pudo verificar"
          },
          environment: {
            nodeEnv: "unknown",
            hasAirtableKey: false,
            hasAirtableBase: false,
            hasWebhookUrl: false,
          }
        },
        duration: 0,
        message: "Error ejecutando la verificación",
        error: error instanceof Error ? error.message : "Error desconocido"
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const getStatusIcon = (success: boolean, error?: string) => {
    if (error) return <XCircle className="h-4 w-4 text-red-500" />;
    if (success) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusColor = (success: boolean, error?: string) => {
    if (error) return "text-red-700 bg-red-50 border-red-200";
    if (success) return "text-green-700 bg-green-50 border-green-200";
    return "text-yellow-700 bg-yellow-50 border-yellow-200";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">🔐 Verificación de Permisos</h1>
          <p className="text-muted-foreground">
            Verifica que todos los servicios externos estén configurados y accesibles
          </p>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={checkPermissions}
            disabled={isChecking}
            size="lg"
          >
            {isChecking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Verificar Permisos
              </>
            )}
          </Button>
        </div>

        {result && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(result.success)}
                  {result.message}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <strong>Duración:</strong> {result.duration}ms •
                  <strong> Timestamp:</strong> {result.check.timestamp}
                </div>
              </CardContent>
            </Card>

            {result.error && (
              <Card className="border-red-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-700">
                    <XCircle className="h-5 w-5" />
                    <strong>Error Fatal:</strong>
                  </div>
                  <div className="mt-2 text-red-600">{result.error}</div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Airtable */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">A</span>
                    </div>
                    Airtable
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Configurado</span>
                      {getStatusIcon(result.check.airtable.configured)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Base accesible</span>
                      {getStatusIcon(result.check.airtable.baseAccessible, result.check.airtable.error)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tabla de fotos</span>
                      {getStatusIcon(result.check.airtable.photosTableAccessible, result.check.airtable.error)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Puede crear registros</span>
                      {getStatusIcon(result.check.airtable.canCreateRecords, result.check.airtable.error)}
                    </div>
                  </div>

                  {result.check.airtable.error && (
                    <div className={`p-3 rounded-md border ${getStatusColor(false, result.check.airtable.error)}`}>
                      <strong>Error:</strong> {result.check.airtable.error}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Webhook */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">W</span>
                    </div>
                    Webhook
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Configurado</span>
                      {getStatusIcon(result.check.webhook.configured)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Accesible</span>
                      {getStatusIcon(result.check.webhook.accessible, result.check.webhook.error)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Acepta POST</span>
                      {getStatusIcon(result.check.webhook.acceptsPost, result.check.webhook.error)}
                    </div>
                  </div>

                  {result.check.webhook.error && (
                    <div className={`p-3 rounded-md border ${getStatusColor(false, result.check.webhook.error)}`}>
                      <strong>Error:</strong> {result.check.webhook.error}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Environment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">E</span>
                  </div>
                  Variables de Entorno
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Environment</span>
                    {getStatusIcon(result.check.environment.nodeEnv === 'production')}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Airtable Key</span>
                    {getStatusIcon(result.check.environment.hasAirtableKey)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Airtable Base</span>
                    {getStatusIcon(result.check.environment.hasAirtableBase)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Webhook URL</span>
                    {getStatusIcon(result.check.environment.hasWebhookUrl)}
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  Environment: {result.check.environment.nodeEnv}
                </div>
              </CardContent>
            </Card>

            {/* Información del cliente */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><strong>IP:</strong> {result.check.ip}</div>
                <div><strong>User Agent:</strong> {result.check.userAgent}</div>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle>🔍 Qué verificar si hay problemas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              1. <strong>Si Airtable falla:</strong> Verificar que la API key tenga permisos de escritura y que la base/table existan
            </p>
            <p>
              2. <strong>Si el webhook falla:</strong> Verificar que la URL esté correcta y que el servicio esté funcionando
            </p>
            <p>
              3. <strong>Si las variables faltan:</strong> Revisar la configuración de Vercel/environment variables
            </p>
            <p>
              4. <strong>Comparar resultados:</strong> Ejecuta esto desde diferentes dispositivos para comparar
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}