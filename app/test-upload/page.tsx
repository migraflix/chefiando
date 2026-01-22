"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, CheckCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TestUploadPage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Solo se permiten archivos de imagen",
          variant: "destructive",
        });
        return;
      }

      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo es demasiado grande (máximo 5MB)",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      toast({
        title: "Archivo seleccionado",
        description: `${file.name} (${Math.round(file.size / 1024)}KB)`,
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Selecciona un archivo primero",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      // Convertir imagen a base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // Extraer solo la parte base64 (quitar "data:image/jpeg;base64,")
      const base64Data = base64.split(',')[1];

      // Crear payload para el endpoint
      const payload = {
        marca: "test-brand",
        brandRecordId: "test-record-id",
        batch: 1,
        totalBatches: 1,
        products: [{
          recordId: `test-${Date.now()}`,
          nombre: selectedFile.name,
          contentType: selectedFile.type,
          base64: base64Data
        }]
      };

      console.log('📤 Enviando payload:', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        contentType: selectedFile.type,
        testUpload: process.env.TEST_UPLOAD
      });

      // Enviar al endpoint
      const response = await fetch('/api/products/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResult(result);
        toast({
          title: "✅ Subida exitosa",
          description: `Imagen subida correctamente`,
        });

        console.log('✅ Resultado:', result);

        // Mostrar información adicional
        if (result.gcsInfo) {
          console.log('📦 GCS Info:', result.gcsInfo);
          toast({
            title: "📦 GCS activado",
            description: `Imagen subida a bucket temporal`,
          });
        }
      } else {
        setUploadResult(result);
        toast({
          title: "❌ Error en subida",
          description: result.error || "Error desconocido",
          variant: "destructive",
        });
        console.error('❌ Error:', result);
      }

    } catch (error) {
      console.error('❌ Error:', error);
      toast({
        title: "❌ Error de conexión",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploadResult(null);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🧪 Prueba de Upload GCS</h1>
        <p className="text-muted-foreground">
          Página de prueba para verificar que la subida de imágenes funciona correctamente con Google Cloud Storage.
        </p>
        <div className="mt-2 p-3 bg-muted rounded-lg">
          <strong>Configuración actual:</strong>
          <br />
          TEST_UPLOAD: <code>{process.env.TEST_UPLOAD || 'false'}</code> |
          GCS_BUCKET: <code>{process.env.GCS_BUCKET_NAME || 'no-configurado'}</code>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Panel de subida */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Subir Imagen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selector de archivo */}
            <div>
              <Label htmlFor="file-input">Seleccionar imagen</Label>
              <Input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Máximo 5MB, formatos: JPG, PNG, GIF, WebP
              </p>
            </div>

            {/* Preview */}
            {preview && (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={clearSelection}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Información del archivo */}
            {selectedFile && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">{selectedFile.name}</div>
                <div className="text-sm text-muted-foreground">
                  {Math.round(selectedFile.size / 1024)}KB • {selectedFile.type}
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Subir Imagen
                  </>
                )}
              </Button>

              {selectedFile && (
                <Button variant="outline" onClick={clearSelection}>
                  Limpiar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Panel de resultados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Resultados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {uploadResult ? (
              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${
                  uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="font-medium">
                    {uploadResult.success ? '✅ Éxito' : '❌ Error'}
                  </div>
                  <div className="text-sm mt-1">
                    {uploadResult.message || uploadResult.error}
                  </div>
                </div>

                {/* Información de GCS */}
                {uploadResult.gcsInfo && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="font-medium text-blue-800">📦 GCS Information</div>
                    <div className="text-sm text-blue-700 mt-1">
                      <div>Path: {uploadResult.gcsInfo.path}</div>
                      <div>Size: {Math.round(uploadResult.gcsInfo.size / 1024)}KB</div>
                      <div>Signed URL: Disponible</div>
                    </div>
                  </div>
                )}

                {/* Detalles técnicos */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium">
                    Ver respuesta completa
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(uploadResult, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Upload className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Sube una imagen para ver los resultados aquí</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>ℹ️ Información de Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div><strong>TEST_UPLOAD:</strong> {process.env.TEST_UPLOAD || 'false'}</div>
            <div><strong>GCS_BUCKET_NAME:</strong> {process.env.GCS_BUCKET_NAME || 'no-configurado'}</div>
            <div><strong>GCP_PROJECT_ID:</strong> {process.env.GCP_PROJECT_ID || 'no-configurado'}</div>
            <div><strong>Environment:</strong> {process.env.NODE_ENV || 'development'}</div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <strong>💡 Consejos:</strong>
            <ul className="text-sm mt-1 list-disc list-inside">
              <li>Si TEST_UPLOAD=true, las imágenes van a GCS</li>
              <li>Si TEST_UPLOAD=false, se usa base64 directo</li>
              <li>Revisa la consola del navegador para más detalles</li>
              <li>Los logs del servidor aparecen en la terminal</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}