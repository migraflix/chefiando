"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

interface Product {
  id: string;
  photo: File | null;
  photoPreview: string | null;
  name: string;
  description: string;
  price: string;
  tags: string[];
}

export default function UploadDebugPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      photo: null,
      photoPreview: null,
      name: "",
      description: "",
      price: "",
      tags: [],
    },
  ]);
  const { toast } = useToast();

  const addLog = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };

    setLogs(prev => [...prev, entry]);
    console[level === 'error' ? 'error' : 'log'](`[${level.toUpperCase()}] ${message}`, data || '');
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handlePhotoChange = (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    addLog('info', `Foto seleccionada: ${file.name}`, {
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    // Validar tipo
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      addLog('error', `Tipo de archivo no válido: ${file.type}`);
      toast({
        title: "Tipo de archivo no válido",
        description: "Solo se permiten imágenes JPEG, JPG o PNG",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      addLog('error', `Archivo demasiado grande: ${Math.round(file.size / 1024 / 1024)}MB`);
      toast({
        title: "Archivo demasiado grande",
        description: "El tamaño máximo permitido es 5MB",
        variant: "destructive",
      });
      return;
    }

    addLog('info', 'Creando preview de imagen...');
    const reader = new FileReader();
    reader.onloadend = () => {
      addLog('info', 'Preview creado exitosamente');
      updateProduct(id, {
        photo: file,
        photoPreview: reader.result as string,
      });
    };
    reader.onerror = () => {
      addLog('error', 'Error al crear preview de imagen');
    };
    reader.readAsDataURL(file);
  };

  const validateProducts = (): boolean => {
    addLog('info', 'Iniciando validación de productos...');

    for (const product of products) {
      if (!product.photo) {
        addLog('error', 'Producto sin foto');
        return false;
      }
      if (!product.name.trim()) {
        addLog('error', 'Producto sin nombre');
        return false;
      }
      if (!product.description.trim()) {
        addLog('error', 'Producto sin descripción');
        return false;
      }
    }

    addLog('info', 'Validación completada exitosamente');
    return true;
  };

  const simulateUpload = async () => {
    if (!validateProducts()) {
      addLog('error', 'Validación fallida, abortando upload');
      return;
    }

    setIsUploading(true);
    addLog('info', `Iniciando upload simulado con ${products.length} productos`);

    try {
      // Simular preparación de datos
      addLog('info', 'Preparando FormData...');
      const formData = new FormData();
      formData.append("marca", `debug-test-${Date.now()}`);

      // Simular procesamiento de productos
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        addLog('info', `Procesando producto ${i + 1}/${products.length}: ${product.name}`);

        if (!product.photo) {
          addLog('error', `Producto ${i + 1} sin foto`);
          continue;
        }

        // Simular conversión a base64 (lo que realmente hace la app)
        addLog('info', `Convirtiendo imagen ${i + 1} a base64...`);
        const startConversion = Date.now();

        try {
          const buffer = await product.photo.arrayBuffer();
          addLog('info', `Buffer creado: ${buffer.byteLength} bytes`);

          const base64Data = Buffer.from(buffer).toString("base64");
          addLog('info', `Base64 creado: ${base64Data.length} caracteres en ${Date.now() - startConversion}ms`);

          // Simular creación de datos del producto
          const productData = {
            name: product.name,
            description: product.description,
            price: product.price,
            tags: product.tags
          };

          formData.append("products", JSON.stringify([productData]));
          formData.append(`photo_${i}`, product.photo);

          addLog('info', `Producto ${i + 1} procesado exitosamente`);

        } catch (conversionError) {
          addLog('error', `Error convirtiendo producto ${i + 1}: ${conversionError}`);
          throw conversionError;
        }
      }

      // Simular envío (sin realmente enviarlo)
      addLog('info', 'Enviando datos al servidor...');
      const response = await fetch("/api/products/upload", {
        method: "POST",
        body: formData,
      });

      addLog('info', `Respuesta del servidor: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorData = await response.json();
        addLog('error', 'Error en respuesta del servidor', errorData);
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      addLog('info', 'Upload completado exitosamente', result);

      toast({
        title: "Upload exitoso",
        description: `Procesados ${products.length} productos`,
      });

    } catch (error) {
      addLog('error', `Error en upload: ${error instanceof Error ? error.message : 'Error desconocido'}`, error);
      toast({
        title: "Error en upload",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const logData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      logs: logs
    };

    const dataStr = JSON.stringify(logData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `upload-debug-logs-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warn': return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      default: return <CheckCircle className="h-3 w-3 text-blue-500" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">🐛 Debug de Upload</h1>
          <p className="text-muted-foreground">
            Simula el proceso de upload con logging detallado para identificar problemas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>📝 Configurar Productos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {products.map((product, index) => (
                  <div key={product.id} className="p-4 border rounded-lg space-y-3">
                    <h3 className="font-semibold">Producto {index + 1}</h3>

                    <div>
                      <Label>Foto *</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange(product.id, e)}
                        className="mt-1"
                      />
                      {product.photoPreview && (
                        <img
                          src={product.photoPreview}
                          alt="Preview"
                          className="mt-2 w-20 h-20 object-cover rounded border"
                        />
                      )}
                    </div>

                    <div>
                      <Label>Nombre *</Label>
                      <Input
                        value={product.name}
                        onChange={(e) => updateProduct(product.id, { name: e.target.value })}
                        placeholder="Nombre del producto"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Descripción *</Label>
                      <Textarea
                        value={product.description}
                        onChange={(e) => updateProduct(product.id, { description: e.target.value })}
                        placeholder="Descripción del producto"
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Precio</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={product.price}
                        onChange={(e) => updateProduct(product.id, { price: e.target.value })}
                        placeholder="0.00"
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}

                <Button
                  onClick={simulateUpload}
                  disabled={isUploading}
                  size="lg"
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Simular Upload
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Logs */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>📋 Logs de Debug</CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={clearLogs} size="sm" variant="outline">
                      Limpiar
                    </Button>
                    <Button onClick={exportLogs} size="sm" variant="outline" disabled={logs.length === 0}>
                      Exportar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 border rounded-md p-3 max-h-96 overflow-y-auto">
                  {logs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No hay logs aún. Configura productos y ejecuta el upload.
                    </p>
                  ) : (
                    <div className="space-y-2 text-xs font-mono">
                      {logs.map((log, index) => (
                        <div key={index} className={`flex items-start gap-2 p-2 rounded ${
                          log.level === 'error' ? 'bg-red-50 border border-red-200' :
                          log.level === 'warn' ? 'bg-yellow-50 border border-yellow-200' :
                          'bg-blue-50 border border-blue-200'
                        }`}>
                          {getLogIcon(log.level)}
                          <div className="flex-1">
                            <div className="text-gray-600">{log.timestamp.split('T')[1].split('.')[0]}</div>
                            <div className="text-gray-900">{log.message}</div>
                            {log.data && (
                              <details className="mt-1">
                                <summary className="cursor-pointer text-gray-600">Datos</summary>
                                <pre className="mt-1 text-xs bg-gray-100 p-1 rounded overflow-auto">
                                  {JSON.stringify(log.data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Información del sistema */}
            <Card>
              <CardHeader>
                <CardTitle>💻 Información del Sistema</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <div><strong>Navegador:</strong> {navigator.userAgent.split(' ').pop()}</div>
                <div><strong>Online:</strong> {navigator.onLine ? '✅' : '❌'}</div>
                <div><strong>Memoria:</strong> {
                  'memory' in performance ?
                  `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB usado` :
                  'No disponible'
                }</div>
                <div><strong>Conexión:</strong> {
                  'connection' in navigator ?
                  `${(navigator as any).connection.effectiveType} (${(navigator as any).connection.downlink} Mbps)` :
                  'No disponible'
                }</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>🎯 ¿Qué buscar en los logs?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Errores comunes:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>"Error convirtiendo imagen a base64"</strong> → Problema de memoria o archivo corrupto</li>
              <li><strong>"Tipo de archivo no válido"</strong> → Imagen en formato no soportado</li>
              <li><strong>"Archivo demasiado grande"</strong> → Imagen supera el límite de 5MB</li>
              <li><strong>"Error en respuesta del servidor"</strong> → Problema en el backend o webhook</li>
              <li><strong>Timeouts largos</strong> → Conexión lenta o procesamiento pesado</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}