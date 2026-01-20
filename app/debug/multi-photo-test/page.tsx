"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface TestResult {
  success: boolean;
  duration: number;
  productsCount?: number;
  error?: string;
  details?: any;
  logs: string[];
}

export default function MultiPhotoTestPage() {
  const [numPhotos, setNumPhotos] = useState(3);
  const [imageSize, setImageSize] = useState(300); // KB
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const createTestImage = (sizeInKB: number): File => {
    // Crear una imagen base64 del tamaño especificado
    const baseImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    // Repetir para alcanzar el tamaño deseado
    const repetitions = Math.ceil((sizeInKB * 1024) / baseImage.length);
    let largeImage = baseImage.repeat(repetitions);

    // Limitar para evitar problemas
    if (largeImage.length > 1024 * 1024) { // Máximo 1MB
      largeImage = largeImage.substring(0, 1024 * 1024);
    }

    // Convertir a blob y luego a File
    const byteCharacters = atob(largeImage);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    return new File([blob], `test-image-${sizeInKB}kb.png`, { type: 'image/png' });
  };

  const runMultiPhotoTest = async () => {
    setIsTesting(true);
    setResult(null);

    const logs: string[] = [];
    const startTime = Date.now();

    const addLog = (message: string) => {
      logs.push(`[${new Date().toLocaleTimeString()}] ${message}`);
      console.log(message);
    };

    try {
      addLog(`🚀 Iniciando test con ${numPhotos} fotos de ~${imageSize}KB cada una`);

      // Crear FormData
      const formData = new FormData();
      formData.append("marca", `test-multi-${Date.now()}`);

      // Crear productos de prueba
      const products = [];
      for (let i = 0; i < numPhotos; i++) {
        products.push({
          name: `Producto Test ${i + 1}`,
          description: `Descripción del producto ${i + 1}. Esta es una descripción de prueba para verificar el procesamiento de múltiples imágenes pesadas. `.repeat(3),
          price: `${(i + 1) * 25}.99`,
          tags: ["test", "multi", `photo${i + 1}`]
        });
      }

      formData.append("products", JSON.stringify(products));
      addLog(`📦 Creados ${products.length} productos de prueba`);

      // Crear y agregar imágenes
      let totalSize = 0;
      for (let i = 0; i < numPhotos; i++) {
        addLog(`📸 Creando imagen ${i + 1}/${numPhotos}...`);
        const testImage = createTestImage(imageSize);
        formData.append(`photo_${i}`, testImage);
        totalSize += testImage.size;
        addLog(`   ✅ Imagen ${i + 1}: ${Math.round(testImage.size / 1024)}KB`);
      }

      addLog(`📊 Tamaño total estimado: ${Math.round(totalSize / 1024)}KB`);

      // Enviar la petición
      addLog(`🚀 Enviando petición a /api/products/upload...`);

      const response = await fetch("/api/products/upload", {
        method: "POST",
        body: formData,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      addLog(`⏱️  Respuesta recibida en ${duration}ms`);
      addLog(`📊 Status: ${response.status} ${response.statusText}`);

      const data = await response.json();

      if (!response.ok) {
        addLog(`❌ Error en respuesta: ${data.error}`);
        if (data.details) {
          addLog(`📋 Detalles: ${JSON.stringify(data.details, null, 2)}`);
        }

        setResult({
          success: false,
          duration,
          error: data.error,
          details: data.details,
          logs
        });
      } else {
        addLog(`✅ Éxito: ${JSON.stringify(data, null, 2)}`);

        setResult({
          success: true,
          duration,
          productsCount: data.productsCount,
          logs
        });
      }

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      addLog(`💥 Error fatal: ${error instanceof Error ? error.message : 'Error desconocido'}`);

      setResult({
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Error fatal',
        logs
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">🖼️ Test de Múltiples Fotos Pesadas</h1>
          <p className="text-muted-foreground">
            Simula el escenario donde algunos usuarios no pueden subir 2+ fotos pesadas
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>⚙️ Configuración del Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numPhotos">Número de Fotos</Label>
                <Input
                  id="numPhotos"
                  type="number"
                  min="1"
                  max="5"
                  value={numPhotos}
                  onChange={(e) => setNumPhotos(parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="imageSize">Tamaño por Imagen (KB)</Label>
                <Input
                  id="imageSize"
                  type="number"
                  min="50"
                  max="1000"
                  value={imageSize}
                  onChange={(e) => setImageSize(parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <strong>Tamaño total estimado:</strong> ~{numPhotos * imageSize}KB
            </div>

            <Button
              onClick={runMultiPhotoTest}
              disabled={isTesting}
              size="lg"
              className="w-full"
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ejecutando Test...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Ejecutar Test de {numPhotos} Fotos
                </>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div><strong>Duración:</strong> {result.duration}ms</div>
                <div><strong>Éxito:</strong> {result.success ? '✅ Sí' : '❌ No'}</div>
                {result.productsCount && (
                  <div><strong>Productos:</strong> {result.productsCount}</div>
                )}
              </div>

              {result.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <strong className="text-red-800">Error:</strong>
                  <div className="text-red-700 mt-1">{result.error}</div>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-red-600">Detalles técnicos</summary>
                      <pre className="mt-2 text-xs text-red-800 bg-red-100 p-2 rounded overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-semibold">📋 Logs del Proceso:</h3>
                <div className="bg-gray-50 border rounded-md p-3 max-h-96 overflow-y-auto">
                  <div className="space-y-1 text-xs font-mono">
                    {result.logs.map((log, index) => (
                      <div key={index} className="text-gray-700">{log}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Análisis del resultado */}
              <div className="space-y-2">
                <h3 className="font-semibold">🔍 Análisis:</h3>
                <div className="text-sm space-y-1">
                  {result.duration > 25000 && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="h-4 w-4" />
                      Duración excesiva ({result.duration}ms) - posible timeout de Vercel
                    </div>
                  )}
                  {result.duration > 8000 && result.duration <= 25000 && (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertTriangle className="h-4 w-4" />
                      Duración alta ({result.duration}ms) - cerca del límite de Vercel Hobby
                    </div>
                  )}
                  {!result.success && !result.error && (
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      Error sin mensaje específico - revisar logs del servidor
                    </div>
                  )}
                  {result.success && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Test completado exitosamente
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>💡 Información Técnica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Límites de Vercel:</strong> Hobby (10s, 1008MB RAM), Pro (30s, 3008MB RAM)
            </p>
            <p>
              <strong>Problema típico:</strong> Múltiples imágenes grandes consumen memoria y tiempo de procesamiento
            </p>
            <p>
              <strong>Posibles causas:</strong> Conversión a base64, procesamiento secuencial, límites de memoria
            </p>
            <p>
              <strong>Solución sugerida:</strong> Procesamiento asíncrono o compresión previa
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}