"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Download, Copy, CheckCircle, XCircle } from "lucide-react";
// Using inline SVG for alert icon
import { useToast } from "@/hooks/use-toast";

interface DiagnosticData {
  timestamp: string;
  sessionId: string;
  userInfo: {
    userAgent: string;
    language: string;
    platform: string;
    cookieEnabled: boolean;
    onLine: boolean;
    timezone: string;
    screen: {
      width: number;
      height: number;
      colorDepth: number;
      pixelRatio: number;
    };
  };
  connection: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  };
  memory: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
  performance: {
    navigationStart: number;
    loadEventEnd: number;
    domContentLoadedEventEnd: number;
  };
  images: Array<{
    index: number;
    name: string;
    size: number;
    type: string;
    lastModified: number;
    width?: number;
    height?: number;
  }>;
  formData: {
    marca: string;
    productsCount: number;
    totalSize: number;
  };
  tests: {
    fileReader: boolean;
    formData: boolean;
    fetch: boolean;
    jsonStringify: boolean;
  };
  errors: string[];
  warnings: string[];
}

export default function UserDiagnosticPage() {
  const [diagnostic, setDiagnostic] = useState<DiagnosticData | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [marca, setMarca] = useState("test-diagnostic");
  const { toast } = useToast();

  const generateSessionId = () => {
    return `diag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const getImageDimensions = (file: File): Promise<{width: number, height: number}> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    const sessionId = generateSessionId();

    const diag: DiagnosticData = {
      timestamp: new Date().toISOString(),
      sessionId,
      userInfo: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: {
          width: screen.width,
          height: screen.height,
          colorDepth: screen.colorDepth,
          pixelRatio: window.devicePixelRatio
        }
      },
      connection: {},
      memory: {},
      performance: {
        navigationStart: performance.timing.navigationStart,
        loadEventEnd: performance.timing.loadEventEnd,
        domContentLoadedEventEnd: performance.timing.domContentLoadedEventEnd
      },
      images: [],
      formData: {
        marca: "",
        productsCount: 0,
        totalSize: 0
      },
      tests: {
        fileReader: false,
        formData: false,
        fetch: false,
        jsonStringify: false
      },
      errors: [],
      warnings: []
    };

    try {
      console.log(`🔍 Iniciando diagnóstico ${sessionId}`);

      // Información de conexión
      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        diag.connection = {
          effectiveType: conn.effectiveType,
          downlink: conn.downlink,
          rtt: conn.rtt,
          saveData: conn.saveData
        };
      }

      // Información de memoria
      if ('memory' in performance) {
        const mem = (performance as any).memory;
        diag.memory = {
          usedJSHeapSize: mem.usedJSHeapSize,
          totalJSHeapSize: mem.totalJSHeapSize,
          jsHeapSizeLimit: mem.jsHeapSizeLimit
        };
      }

      // Tests básicos
      try {
        const reader = new FileReader();
        diag.tests.fileReader = true;
      } catch (e) {
        diag.errors.push(`FileReader test failed: ${e}`);
      }

      try {
        const fd = new FormData();
        fd.append('test', 'value');
        diag.tests.formData = true;
      } catch (e) {
        diag.errors.push(`FormData test failed: ${e}`);
      }

      try {
        await fetch('/api/debug/permissions');
        diag.tests.fetch = true;
      } catch (e) {
        diag.errors.push(`Fetch test failed: ${e}`);
      }

      try {
        JSON.stringify({ test: 'complex object with "quotes" and \'apostrophes\'' });
        diag.tests.jsonStringify = true;
      } catch (e) {
        diag.errors.push(`JSON.stringify test failed: ${e}`);
      }

      // Procesar imágenes seleccionadas
      if (selectedFiles.length > 0) {
        console.log(`📸 Procesando ${selectedFiles.length} imágenes...`);

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];

          try {
            const dimensions = await getImageDimensions(file);

            diag.images.push({
              index: i,
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
              width: dimensions.width,
              height: dimensions.height
            });

            console.log(`✅ Imagen ${i}: ${file.name} (${Math.round(file.size/1024)}KB, ${dimensions.width}x${dimensions.height})`);
          } catch (e) {
            diag.images.push({
              index: i,
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified
            });
            diag.warnings.push(`Failed to get dimensions for ${file.name}: ${e}`);
          }
        }
      }

      // Calcular datos del form
      diag.formData = {
        marca,
        productsCount: selectedFiles.length,
        totalSize: selectedFiles.reduce((sum, file) => sum + file.size, 0)
      };

      // Advertencias basadas en los datos
      if (diag.formData.totalSize > 2 * 1024 * 1024) { // 2MB
        diag.warnings.push(`Total size (${Math.round(diag.formData.totalSize/1024/1024)}MB) exceeds recommended limit`);
      }

      if (selectedFiles.length > 3) {
        diag.warnings.push(`${selectedFiles.length} images selected (recommended: max 3)`);
      }

      if (diag.memory.usedJSHeapSize && diag.memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
        diag.warnings.push(`High memory usage (${Math.round(diag.memory.usedJSHeapSize/1024/1024)}MB) may cause issues`);
      }

      console.log(`✅ Diagnóstico completado: ${diag.errors.length} errores, ${diag.warnings.length} advertencias`);

      setDiagnostic(diag);

      toast({
        title: "Diagnóstico completado",
        description: `Encontrados ${diag.errors.length} errores y ${diag.warnings.length} advertencias`,
      });

    } catch (error) {
      console.error("❌ Error en diagnóstico:", error);
      toast({
        title: "Error en diagnóstico",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const exportDiagnostic = () => {
    if (!diagnostic) return;

    const dataStr = JSON.stringify(diagnostic, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `diagnostic-${diagnostic.sessionId}.json`;
    link.click();

    URL.revokeObjectURL(url);

    toast({
      title: "Archivo exportado",
      description: `diagnostic-${diagnostic.sessionId}.json`,
    });
  };

  const copyToClipboard = async () => {
    if (!diagnostic) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnostic, null, 2));
      toast({
        title: "Copiado al portapapeles",
        description: "Datos del diagnóstico copiados",
      });
    } catch (error) {
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">🔍 Diagnóstico Detallado de Usuario</h1>
          <p className="text-muted-foreground">
            Herramienta para identificar diferencias entre usuarios que funcionan y los que no
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>⚙️ Configuración del Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="marca">ID de Marca</Label>
                <Input
                  id="marca"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  className="mt-1"
                  placeholder="test-diagnostic"
                />
              </div>
              <div>
                <Label htmlFor="files">Seleccionar Imágenes</Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm text-blue-800">
                  <strong>Imágenes seleccionadas:</strong> {selectedFiles.length}
                  <div className="mt-1 space-y-1">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="text-xs">
                        {index + 1}. {file.name} ({Math.round(file.size / 1024)}KB)
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={runDiagnostic}
              disabled={isRunning}
              size="lg"
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ejecutando Diagnóstico...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Ejecutar Diagnóstico Completo
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {diagnostic && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>📊 Resultados del Diagnóstico</span>
                  <div className="flex gap-2">
                    <Button onClick={copyToClipboard} size="sm" variant="outline">
                      <Copy className="mr-1 h-3 w-3" />
                      Copiar
                    </Button>
                    <Button onClick={exportDiagnostic} size="sm" variant="outline">
                      <Download className="mr-1 h-3 w-3" />
                      Exportar
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div><strong>Session ID:</strong> {diagnostic.sessionId}</div>
                  <div><strong>Timestamp:</strong> {diagnostic.timestamp}</div>
                  <div><strong>Timezone:</strong> {diagnostic.userInfo.timezone}</div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Información del Usuario */}
              <Card>
                <CardHeader>
                  <CardTitle>👤 Información del Usuario</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div><strong>Navegador:</strong> {diagnostic.userInfo.userAgent.split(' ').pop()}</div>
                  <div><strong>Plataforma:</strong> {diagnostic.userInfo.platform}</div>
                  <div><strong>Idioma:</strong> {diagnostic.userInfo.language}</div>
                  <div><strong>Online:</strong> {diagnostic.userInfo.onLine ? '✅' : '❌'}</div>
                  <div><strong>Cookies:</strong> {diagnostic.userInfo.cookieEnabled ? '✅' : '❌'}</div>
                  <div><strong>Pantalla:</strong> {diagnostic.userInfo.screen.width}x{diagnostic.userInfo.screen.height} ({diagnostic.userInfo.screen.colorDepth}bit)</div>
                  <div><strong>Pixel Ratio:</strong> {diagnostic.userInfo.screen.pixelRatio}</div>
                </CardContent>
              </Card>

              {/* Conexión */}
              <Card>
                <CardHeader>
                  <CardTitle>🌐 Conexión</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {diagnostic.connection.effectiveType ? (
                    <>
                      <div><strong>Tipo:</strong> {diagnostic.connection.effectiveType}</div>
                      <div><strong>Velocidad ↓:</strong> {diagnostic.connection.downlink} Mbps</div>
                      <div><strong>Latencia:</strong> {diagnostic.connection.rtt}ms</div>
                      <div><strong>Ahorro de datos:</strong> {diagnostic.connection.saveData ? '✅' : '❌'}</div>
                    </>
                  ) : (
                    <div className="text-muted-foreground">Información de conexión no disponible</div>
                  )}
                </CardContent>
              </Card>

              {/* Memoria */}
              <Card>
                <CardHeader>
                  <CardTitle>🧠 Memoria</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {diagnostic.memory.usedJSHeapSize ? (
                    <>
                      <div><strong>Usada:</strong> {Math.round(diagnostic.memory.usedJSHeapSize / 1024 / 1024)}MB</div>
                      <div><strong>Total:</strong> {Math.round(diagnostic.memory.totalJSHeapSize / 1024 / 1024)}MB</div>
                      <div><strong>Límite:</strong> {Math.round(diagnostic.memory.jsHeapSizeLimit / 1024 / 1024)}MB</div>
                      <div><strong>Uso:</strong> {Math.round((diagnostic.memory.usedJSHeapSize / diagnostic.memory.jsHeapSizeLimit) * 100)}%</div>
                    </>
                  ) : (
                    <div className="text-muted-foreground">Información de memoria no disponible</div>
                  )}
                </CardContent>
              </Card>

              {/* Tests */}
              <Card>
                <CardHeader>
                  <CardTitle>🧪 Tests de Compatibilidad</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>FileReader API</span>
                    {diagnostic.tests.fileReader ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>FormData API</span>
                    {diagnostic.tests.formData ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Fetch API</span>
                    {diagnostic.tests.fetch ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>JSON.stringify</span>
                    {diagnostic.tests.jsonStringify ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Imágenes */}
            {diagnostic.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>📸 Información de Imágenes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {diagnostic.images.map((img, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-md">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div><strong>Nombre:</strong> {img.name}</div>
                          <div><strong>Tamaño:</strong> {Math.round(img.size / 1024)}KB</div>
                          <div><strong>Tipo:</strong> {img.type}</div>
                          <div><strong>Dimensiones:</strong> {img.width}x{img.height}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Errores y Advertencias */}
            {(diagnostic.errors.length > 0 || diagnostic.warnings.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>⚠️ Problemas Detectados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {diagnostic.errors.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-red-600 flex items-center gap-2 mb-2">
                        <XCircle className="h-4 w-4" />
                        Errores ({diagnostic.errors.length})
                      </h4>
                      <div className="space-y-1">
                        {diagnostic.errors.map((error, index) => (
                          <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {diagnostic.warnings.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-yellow-600 flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        Advertencias ({diagnostic.warnings.length})
                      </h4>
                      <div className="space-y-1">
                        {diagnostic.warnings.map((warning, index) => (
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

            {/* Información para compartir */}
            <Card>
              <CardHeader>
                <CardTitle>📤 Compartir Diagnóstico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-gray-50 border rounded-md">
                  <p className="text-sm text-muted-foreground mb-2">
                    Para comparar con otros usuarios, comparte este Session ID:
                  </p>
                  <div className="font-mono text-lg font-bold text-center p-2 bg-white border rounded">
                    {diagnostic.sessionId}
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p><strong>Instrucciones para el usuario problemático:</strong></p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Visitar esta misma página</li>
                    <li>Seleccionar las mismas imágenes que causan el problema</li>
                    <li>Ejecutar el diagnóstico</li>
                    <li>Enviar el Session ID generado</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle>🔍 ¿Qué puede estar causando el problema?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>Esta herramienta identifica diferencias específicas entre usuarios que pueden explicar por qué algunos funcionan y otros no:</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-orange-600">🔴 Problemas Comunes</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Navegador incompatible (Safari, Firefox antiguo)</li>
                  <li>• Memoria insuficiente en el dispositivo</li>
                  <li>• Conexión a internet muy lenta</li>
                  <li>• Imágenes demasiado grandes/pesadas</li>
                  <li>• APIs del navegador deshabilitadas</li>
                  <li>• Extensiones del navegador conflictivas</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">✅ Soluciones Rápidas</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Recomendar usar Chrome/Edge</li>
                  <li>• Limitar a 2 imágenes máximo</li>
                  <li>• Comprimir imágenes automáticamente</li>
                  <li>• Agregar validación de memoria</li>
                  <li>• Mejorar mensajes de error</li>
                  <li>• Implementar reintentos automáticos</li>
                </ul>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 mb-2">
                <strong>📋 Para usar la comparación automática:</strong>
              </p>
              <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                <li>Exporta el diagnóstico del usuario que funciona</li>
                <li>Exporta el diagnóstico del usuario con problema</li>
                <li>Ejecuta: <code className="bg-blue-100 px-1 rounded">node compare-diagnostics.js archivo1.json archivo2.json</code></li>
                <li>Revisa el análisis automático de diferencias</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}