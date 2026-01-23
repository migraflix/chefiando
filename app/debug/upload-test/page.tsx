"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, TriangleAlert } from "lucide-react";

interface TestResult {
  success: boolean;
  result: {
    timestamp: string;
    userAgent: string;
    ip: string;
    marca: string;
    productsCount: number;
    photosCount: number;
    totalSize: number;
    contentTypes: string[];
    validationPassed: boolean;
    airtableTest: boolean;
    webhookTest: boolean;
    errors: string[];
    warnings: string[];
  };
  duration: number;
  message: string;
  error?: string;
}

export default function UploadTestPage() {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [marca, setMarca] = useState("test-marca-debug");

  const runUploadTest = async () => {
    setIsTesting(true);
    setResult(null);

    try {
      // Crear FormData de prueba
      const formData = new FormData();
      formData.append("marca", marca);

      // Crear producto de prueba
      const testProduct = {
        name: "Producto de Prueba",
        description: "Esta es una descripción de prueba para verificar el funcionamiento del upload.",
        price: "25.50",
        tags: ["vegetariano"]
      };

      formData.append("products", JSON.stringify([testProduct]));

      // Crear imagen de prueba (1x1 pixel PNG base64)
      const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const testImageBlob = await fetch(`data:image/png;base64,${testImageBase64}`).then(r => r.blob());
      const testImageFile = new File([testImageBlob], "test-image.png", { type: "image/png" });

      formData.append("photo_0", testImageFile);

      console.log("🧪 Enviando test de upload con datos:", {
        marca,
        productsCount: 1,
        hasPhoto: true,
        photoSize: testImageFile.size,
        photoType: testImageFile.type
      });

      const response = await fetch("/api/debug/upload-test", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error en el test");
      }

      setResult(data);
      console.log("✅ Resultado del test:", data);

    } catch (error) {
      console.error("❌ Error en test:", error);
      setResult({
        success: false,
        result: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          ip: "unknown",
          marca: "",
          productsCount: 0,
          photosCount: 0,
          totalSize: 0,
          contentTypes: [],
          validationPassed: false,
          airtableTest: false,
          webhookTest: false,
          errors: [error instanceof Error ? error.message : "Error desconocido"],
          warnings: []
        },
        duration: 0,
        message: "Error ejecutando el test",
        error: error instanceof Error ? error.message : "Error desconocido"
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">🧪 Test de Upload de Fotos</h1>
          <p className="text-muted-foreground">
            Esta herramienta ayuda a identificar por qué algunos usuarios no pueden subir fotos
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuración del Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                ID de Marca (para testing)
              </label>
              <Input
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="test-marca-debug"
                className="max-w-md"
              />
            </div>

            <Button
              onClick={runUploadTest}
              disabled={isTesting}
              size="lg"
              className="w-full max-w-md"
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ejecutando Test...
                </>
              ) : (
                "Ejecutar Test de Upload"
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Resultado del Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <strong>Duración:</strong> {result.duration}ms
              </div>

              <div className="text-sm">
                <strong>Mensaje:</strong> {result.message}
              </div>

              {result.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <strong className="text-red-800">Error Fatal:</strong>
                  <div className="text-red-700 mt-1">{result.error}</div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">📊 Información del Usuario</h3>
                  <div className="text-sm space-y-1">
                    <div><strong>IP:</strong> {result.result.ip}</div>
                    <div><strong>User Agent:</strong> {result.result.userAgent.substring(0, 50)}...</div>
                    <div><strong>Timestamp:</strong> {result.result.timestamp}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">📦 Datos del Upload</h3>
                  <div className="text-sm space-y-1">
                    <div><strong>Marca:</strong> {result.result.marca}</div>
                    <div><strong>Productos:</strong> {result.result.productsCount}</div>
                    <div><strong>Fotos:</strong> {result.result.photosCount}</div>
                    <div><strong>Tamaño Total:</strong> {Math.round(result.result.totalSize / 1024)}KB</div>
                    <div><strong>Tipos de Archivo:</strong> {result.result.contentTypes.join(", ")}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">🔧 Estado de Servicios</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {result.result.airtableTest ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">Airtable</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.result.webhookTest ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">Webhook</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.result.validationPassed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">Validación</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">✅ Validación General</h3>
                  <div className="flex items-center gap-2">
                    {result.result.validationPassed ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {result.result.validationPassed ? "Todo OK" : "Hay problemas"}
                    </span>
                  </div>
                </div>
              </div>

              {result.result.errors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-red-600 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Errores ({result.result.errors.length})
                  </h3>
                  <div className="space-y-1">
                    {result.result.errors.map((error, index) => (
                      <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.result.warnings.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-yellow-600 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Advertencias ({result.result.warnings.length})
                  </h3>
                  <div className="space-y-1">
                    {result.result.warnings.map((warning, index) => (
                      <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>🔍 Cómo Usar Esta Herramienta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              1. <strong>Ejecuta el test</strong> para verificar que todos los servicios estén funcionando
            </p>
            <p>
              2. <strong>Si hay errores</strong>, revisa los detalles específicos para identificar el problema
            </p>
            <p>
              3. <strong>Comparte los resultados</strong> con usuarios que tienen problemas para comparar
            </p>
            <p>
              4. <strong>Revisa los logs de Sentry</strong> para errores específicos de usuarios
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}