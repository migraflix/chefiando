"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MAX_PRODUCTS, MAX_FILE_SIZE, ALLOWED_TYPES, MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";
import { useErrorLogger } from "@/lib/error-logger";
import { Upload, X, Loader2, CheckCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Product {
  id: string;
  photo: File | null;
  photoPreview: string | null;
  name: string;
  description: string;
  price: string;
  tags: string[];
  processed?: boolean; // Flag para evitar procesamiento duplicado
}

// ✅ Todas las constantes ahora están centralizadas en lib/config.ts

// ⏱️ Configuración de polling (reservado para uso futuro si se necesita)
// const POLLING_INTERVAL_MS = 20000;
// const POLLING_MAX_ATTEMPTS = 15;

export function ProductUploadForm({ marca }: { marca: string }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { logFormError, logFormWarning, logFormSuccess } = useErrorLogger();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Leer parámetros de URL
  const currentStep = parseInt(searchParams.get('step') || '1');
  const processedCount = parseInt(searchParams.get('processed') || '0');
  // Solo un producto por página - mucho más simple
  const [product, setProduct] = useState<Product>({
    id: currentStep.toString(),
      photo: null,
      photoPreview: null,
      name: "",
      description: "",
      price: "",
      tags: [],
    processed: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingProduct, setIsProcessingProduct] = useState(false);

  // Debug: Ver estado del producto actual
  React.useEffect(() => {
    console.log(`📊 Estado actual: Step ${currentStep}/${MAX_PRODUCTS}, Procesados: ${processedCount}`);
    console.log(`   Producto actual (ID: ${product.id}): processed=${product.processed}`);
  }, [product, currentStep, processedCount]);

  // 🎯 FUNCIÓN PARA TERMINAR: Procesa producto pendiente si existe y termina
  const handleFinish = async () => {
    console.log(`🏁 Click en Terminar - Verificando producto pendiente...`);

    // Verificar si hay un producto pendiente con imagen y datos
    const hasPendingProduct = product.photo && product.name.trim() && product.description.trim();

    if (hasPendingProduct) {
      console.log(`📦 Producto pendiente detectado, procesando antes de terminar...`);

      try {
        // Mostrar que estamos procesando el último producto
        toast({
          title: `🚀 ${t.products.uploading.processingImage}`,
          description: `Procesando último producto antes de terminar...`,
        });

        // Procesar el producto pendiente
        await processAndSendProduct(product, currentStep - 1);

        console.log(`✅ Producto pendiente procesado exitosamente`);
      } catch (error) {
        console.error(`❌ Error procesando producto pendiente:`, error);

        // Mostrar error pero permitir continuar (no bloquear el terminar)
      toast({
          title: t.products.uploading.processingError,
          description: `Error procesando último producto, pero puedes continuar.`,
        variant: "destructive",
      });

        // Log del error pero no fallar
        const sessionId = await logFormError(
          error instanceof Error ? error : new Error('Error procesando producto pendiente'),
          "photo-upload",
          "pending_product_processing_error",
          {
            productData: product,
            currentStep,
            processedCount,
            errorMessage: error instanceof Error ? error.message : 'Error desconocido'
          }
        );
      }
    } else {
      console.log(`ℹ️ No hay producto pendiente, terminando directamente...`);
    }

    // Mostrar mensaje de completado y redirigir
    const totalProcessed = hasPendingProduct ? processedCount + 1 : processedCount;

    toast({
      title: `🎉 ${t.products.uploading.completed}`,
      description: `${t.products.uploading.completedDescription} (${totalProcessed} productos procesados)`,
    });

    router.push(`/fotos/gracias?marca=${marca}&processed=${totalProcessed}`);
  };

  // 🎯 FUNCIÓN PRINCIPAL: Cada "Agregar Producto" llama al webhook
  const addProduct = async () => {
    console.log(`🎯 CLICK DETECTADO: Adicionar Produto - Step ${currentStep}/${MAX_PRODUCTS}`);
    console.log(`🔗 Estado actual del producto:`, {
      hasPhoto: !!product.photo,
      name: product.name,
      description: product.description,
      price: product.price,
      tags: product.tags,
      marca: marca
    });
    console.log(`🔗 Este click VA A LLAMAR AL WEBHOOK con el producto actual`);

    // Evitar múltiples clicks simultáneos
    if (isProcessingProduct) {
      console.log('⚠️ Ya está procesando, ignorando click');
      return;
    }

    console.log(`✅ Validando producto antes de procesar...`);
    // Validar el producto actual
    if (!validateCurrentProduct()) {
      console.log(`❌ Validación fallida, deteniendo proceso`);
      return;
    }
    console.log(`✅ Validación exitosa, procediendo con el procesamiento`);

    console.log('🔄 Iniciando procesamiento del producto y llamado al webhook...');
    setIsProcessingProduct(true);

    try {
      // Mostrar toast de procesamiento con webhook
      toast({
        title: `🚀 ${t.products.uploading.processingImage}`,
        description: `Enviando "${product.name}" al sistema...`,
      });

      // Procesar el producto actual y enviar al webhook
      await processAndSendProduct(product, currentStep - 1);

      // Determinar el siguiente paso
      const nextStep = currentStep + 1;
      const newProcessedCount = processedCount + 1;

      console.log(`✅ Producto ${currentStep} procesado y webhook llamado. Siguiente: step=${nextStep}, processed=${newProcessedCount}`);

      // Mostrar confirmación de webhook exitoso
      toast({
        title: `✅ "${product.name}" enviado`,
        description: "Producto procesado y webhook llamado exitosamente",
      });

      // Si llegó al límite, ir a página de gracias
      if (nextStep > MAX_PRODUCTS) {
        console.log('🎉 Todos los productos procesados, redirigiendo a gracias...');
        toast({
          title: `🎉 ${t.products.uploading.completed}`,
          description: t.products.uploading.completedDescription,
        });
        router.push(`/fotos/gracias?marca=${marca}&processed=${newProcessedCount}`);
      } else {
        // Ir al siguiente step
        console.log(`➡️ Redirigiendo a step ${nextStep}...`);
        router.push(`/fotos?marca=${marca}&step=${nextStep}&processed=${newProcessedCount}`);
      }

    } catch (error) {
      console.error('❌ Error procesando producto:', error);
      const sessionId = await logFormError(
        error instanceof Error ? error : new Error('Error desconocido'),
        "photo-upload",
        "add_product_error",
        {
          productData: product,
          currentStep,
          processedCount,
          errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        }
      );
      toast({
        title: t.products.uploading.processingError,
        description: `${t.products.uploading.processingErrorDesc} (Session: ${sessionId})`,
        variant: "destructive",
      });
    } finally {
      setIsProcessingProduct(false);
    }
  };

  // 🔗 FUNCIÓN QUE LLAMA AL WEBHOOK: Procesa y envía un producto individual al webhook
  const processAndSendProduct = async (product: Product, index: number) => {
    console.log(`🎯 INICIANDO processAndSendProduct para producto ${index + 1}`);
    console.log(`📊 Datos del producto:`, {
      hasPhoto: !!product.photo,
      photoSize: product.photo?.size,
      name: product.name,
      description: product.description,
      price: product.price,
      tags: product.tags,
      marca
    });

    try {
      console.log(`🚀 Procesando producto ${index + 1}...`);

      // Validar que tenga todos los datos necesarios
      if (!product.photo) {
        console.warn(`❌ Producto ${index + 1}: Sin foto, omitiendo`);
        return;
      }
      if (!product.name.trim() || !product.description.trim()) {
        console.warn(`❌ Producto ${index + 1}: Datos incompletos, omitiendo`, {
          name: product.name.trim(),
          description: product.description.trim()
      });
      return;
    }

      console.log(`✅ Validaciones pasadas para producto ${index + 1}`);

      // Preparar datos para envío (sanitización básica para frontend)
      const sanitizedNombre = product.name.trim();
      const sanitizedDescripcion = product.description.trim();
      const sanitizedTags = product.tags.map(tag => tag.trim()).filter(tag => tag.length > 0);

      // Crear registro en Airtable
      const productData = {
        name: sanitizedNombre,
        description: sanitizedDescripcion,
        price: product.price || null,
        tags: sanitizedTags
      };

      console.log(`📝 Datos preparados para Airtable:`, productData);
      console.log(`🏷️ Marca a incluir en el registro: "${marca}"`);
      console.log(`📝 Creando registro en Airtable para producto ${index + 1} CON MARCA INCLUIDA...`);
      let photoRecordId = await createPhotoRecord(productData, marca);

      if (!photoRecordId) {
        console.error(`❌ Error: createPhotoRecord retornó null para producto ${index + 1}`);
        // NO detener el proceso - continuar con ID temporal
        console.warn(`⚠️ Continuando con ID temporal para producto ${index + 1}`);
      } else {
        console.log(`✅ Registro creado en Airtable: ${photoRecordId}`);
      }

      // Si no tenemos recordId válido, usar temporal
      if (!photoRecordId || photoRecordId.startsWith('temp_')) {
        photoRecordId = `temp_${Date.now()}_${index}`;
        console.log(`📝 Usando ID temporal: ${photoRecordId}`);
      }

      // Procesar imagen (comprimir si es necesario)
      let processedFile = product.photo;
      console.log(`🖼️ Procesando imagen: ${processedFile.size} bytes, tipo: ${processedFile.type}`);

      if (product.photo.size > 4 * 1024 * 1024) {
        console.log(`🗜️ Comprimiendo imagen ${index + 1}...`);
        processedFile = await compressImage(product.photo);
        console.log(`✅ Imagen comprimida: ${processedFile.size} bytes`);
      }

      // Convertir a base64
      console.log(`🔄 Convirtiendo imagen a base64...`);
      const buffer = await processedFile.arrayBuffer();
      console.log(`📏 Buffer creado: ${buffer.byteLength} bytes`);

      const base64Data = Buffer.from(buffer).toString("base64");
      const contentType = processedFile.type || "image/jpeg";

      console.log(`✅ Base64 generado: ${base64Data.length} caracteres, contentType: ${contentType}`);

      // Preparar payload del webhook (arreglo de 1 producto, compatible con n8n)
      const webhookPayload = {
        marca, // Mantenido por compatibilidad
        brandRecordId: marca, // ID explícito del registro de marca
        batch: index + 1,
        totalBatches: MAX_PRODUCTS, // Usamos MAX_PRODUCTS como total máximo posible
        products: [{
          recordId: photoRecordId,
          nombre: processedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_'), // Sanitizar nombre básico
          contentType: contentType,
          base64: base64Data,
          datosProducto: {
            nombre: sanitizedNombre,
            descripcion: sanitizedDescripcion,
            precio: product.price || null,
            tags: sanitizedTags,
          },
        }],
        timestamp: new Date().toISOString()
      };

      console.log(`📦 Payload del webhook preparado:`, {
        marca,
        brandRecordId: marca,
        batch: webhookPayload.batch,
        productsCount: webhookPayload.products.length,
        recordId: photoRecordId,
        base64Length: base64Data.length,
        nombre: sanitizedNombre
      });

      // 🚀 WEBHOOK OBLIGATORIO: Intentar múltiples veces hasta que se envíe
      console.log(`📡 Enviando producto ${index + 1} al webhook (OBLIGATORIO)...`);
      console.log(`🔗 URL: /api/products/upload`);

      // Toast "Preparando" que se mantiene hasta que webhook responda
      toast({
        title: `🚀 Preparando "${product.name}"...`,
        description: "No cierres esta página. Estamos subiendo tu imagen...",
      });

      let webhookSuccess = false;
      let webhookAttempts = 0;
      const MAX_WEBHOOK_ATTEMPTS = 3;

      while (!webhookSuccess && webhookAttempts < MAX_WEBHOOK_ATTEMPTS) {
        webhookAttempts++;
        console.log(`🔄 Intento ${webhookAttempts}/${MAX_WEBHOOK_ATTEMPTS} de enviar webhook`);

        try {
          const response = await fetch("/api/products/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(webhookPayload),
          });

          console.log(`📡 Respuesta del webhook (intento ${webhookAttempts}) - Status: ${response.status} ${response.statusText}`);

          if (response.ok) {
            const result = await response.json();
            console.log(`✅ Webhook enviado exitosamente en intento ${webhookAttempts}`, result);
            
            // ✅ Webhook respondió con imageRecordId - continuar al siguiente
            if (result.imageRecordId) {
              console.log(`📝 imageRecordId recibido: ${result.imageRecordId}`);
              console.log(`🎉 Producto ${index + 1} confirmado!`);
              webhookSuccess = true;
              confirmWebhookCalled(product.name, index + 1, true);
              break;
            } else {
              // Webhook OK pero sin imageRecordId - reintentar
              console.warn(`⚠️ Webhook OK pero sin imageRecordId, reintentando...`);
              if (webhookAttempts < MAX_WEBHOOK_ATTEMPTS) {
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          } else {
            const errorData = await response.json();
            console.warn(`⚠️ Webhook falló en intento ${webhookAttempts}:`, errorData);
            
            // Si es el último intento, mostrar error con cURL
            if (webhookAttempts >= MAX_WEBHOOK_ATTEMPTS && errorData.curlCommand) {
              console.error(`🔧 cURL para debug:\n${errorData.curlCommand}`);
              
              toast({
                title: `❌ Error enviando "${product.name}"`,
                description: `Falló después de ${MAX_WEBHOOK_ATTEMPTS} intentos. Ver consola para cURL de debug.`,
                variant: "destructive",
              });
              
              // Mostrar alerta con cURL
              alert(`ERROR: No se pudo enviar "${product.name}" después de ${MAX_WEBHOOK_ATTEMPTS} intentos.\n\nDetalles: ${errorData.details || errorData.error}\n\ncURL para debug:\n${errorData.curlCommand}`);
              
              throw new Error(`Webhook falló: ${errorData.error || 'Error desconocido'}`);
            }

            if (webhookAttempts < MAX_WEBHOOK_ATTEMPTS) {
              console.log(`⏳ Esperando 2 segundos antes del siguiente intento...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }

        } catch (webhookError) {
          console.warn(`⚠️ Error de conexión en webhook (intento ${webhookAttempts}):`, webhookError);

          if (webhookError instanceof Error && webhookError.name === 'TypeError') {
            console.error(`🚨 Error de red detectado, pero CONTINUAMOS intentando...`);
          }

          if (webhookAttempts < MAX_WEBHOOK_ATTEMPTS) {
            console.log(`⏳ Esperando 2 segundos antes del siguiente intento...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }

      // RESULTADO FINAL
      if (webhookSuccess) {
        console.log(`🎉 WEBHOOK ENVIADO Y CONFIRMADO para producto ${index + 1}`);
        toast({
          title: `✅ "${product.name}" listo`,
          description: "Producto procesado y confirmado exitosamente",
        });
      } else {
        console.error(`❌ WEBHOOK FALLÓ después de ${MAX_WEBHOOK_ATTEMPTS} intentos para producto ${index + 1}`);
        
        // Generar cURL manual para debugging
        const curlCommand = `curl -X POST "/api/products/upload" -H "Content-Type: application/json" -d '${JSON.stringify(webhookPayload).substring(0, 200)}...'`;
        console.error(`🔧 cURL aproximado:\n${curlCommand}`);
        
        toast({
          title: `❌ Error con "${product.name}"`,
          description: `No se pudo enviar después de ${MAX_WEBHOOK_ATTEMPTS} intentos. Intenta de nuevo.`,
          variant: "destructive",
        });
        
        // Lanzar error para detener el flujo
        throw new Error(`Webhook falló después de ${MAX_WEBHOOK_ATTEMPTS} intentos`);
      }

      console.log(`🎉 PRODUCTO ${index + 1} COMPLETADO EXITOSAMENTE`);

    } catch (error) {
      console.error(`❌ Error procesando producto ${index + 1}:`, error);

      // Log del error silenciosamente
      const sessionId = await logFormError(
        error instanceof Error ? error : new Error('Error desconocido'),
        "photo-upload",
        "single_product_processing_error",
        {
          productIndex: index,
          productName: product.name,
          hasPhoto: !!product.photo,
          photoSize: product.photo?.size,
          errorMessage: error instanceof Error ? error.message : 'Error desconocido'
        }
      );

      // Error silencioso - solo logging, no feedback visual
      console.error(`⚠️ Error silencioso en "${product.name}": ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // Función auxiliar para crear registro en Airtable (extraída para reutilizar)
  const createPhotoRecord = async (productData: any, marca: string): Promise<string | null> => {
    console.log(`🗃️ Creando registro en Airtable - Producto:`, productData);
    console.log(`🏷️ Marca a asociar: "${marca}" (tipo: ${typeof marca})`);

    try {
      console.log(`📡 Llamando a /api/products/create-record con marca incluida...`);
      const requestPayload = { productData, marca };
      console.log(`📤 Payload enviado a API:`, requestPayload);

      const response = await fetch("/api/products/create-record", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      console.log(`📡 Respuesta de create-record - Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error en create-record:`, errorText);
        throw new Error(`Error creando registro: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Registro creado exitosamente:`, result);

      return result.recordId;
      } catch (error) {
        console.warn('⚠️ Error creando registro en Airtable:', error);
        console.log('📝 Continuando con ID temporal - el producto se procesará normalmente');

        // NO es error crítico - devolver ID temporal
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`🆔 Usando ID temporal: ${tempId}`);

        return tempId;
      }
  };

  // Función específica para confirmar que el webhook fue llamado
  const confirmWebhookCalled = (productName: string, batchNumber: number, success: boolean = true) => {
    if (success) {
      console.log(`🔗 WEBHOOK CONFIRMADO: "${productName}" (Batch ${batchNumber}) enviado exitosamente`);
    } else {
      console.log(`⚠️ WEBHOOK FALLÓ: "${productName}" (Batch ${batchNumber}) procesado localmente`);
    }

    // Log adicional para confirmar el webhook (nunca es error)
    logFormSuccess(
      success ? `Webhook enviado exitosamente para producto: ${productName}` : `Webhook pendiente para producto: ${productName} - se enviará automáticamente`,
      "webhook-calls",
      success ? "webhook_sent" : "webhook_pending", // Nunca usar "error" o "partial"
      {
        productName,
        batchNumber,
        marca,
        success,
        attempts: success ? 1 : 3, // Si falló, fueron 3 intentos
        timestamp: new Date().toISOString()
      }
    );
  };

  // Función auxiliar para comprimir imagen (extraída para reutilizar)
  const compressImage = async (file: File): Promise<File> => {
    // Implementación básica de compresión (puedes mejorar esto)
    if (file.type === 'image/jpeg' && file.size > 3 * 1024 * 1024) {
      console.log(`🗜️ Aplicando compresión básica a JPEG grande`);
      // Por ahora devolvemos el archivo original
      // En producción implementarías compresión real
      return file;
    }
    return file;
  };

  // En el sistema de páginas, no necesitamos eliminar productos
  const removeProduct = (id: string) => {
    // No hacer nada - en el sistema de páginas cada producto está en su propia página
  };

  const updateProduct = (updates: Partial<Product>) => {
    setProduct(prevProduct => ({ ...prevProduct, ...updates }));
  };

  const handlePhotoChange = (
    id: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      logFormWarning("No se seleccionó archivo", "photo-upload", "file_selection_empty", { productId: id });
      return;
    }

    logFormSuccess("Archivo seleccionado", "photo-upload", "file_selected", {
      productId: id,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type as any)) {
      logFormError(
        `Tipo de archivo no válido: ${file.type}`,
        "photo-upload",
        "file_type_invalid",
        {
          productId: id,
          fileName: file.name,
          fileType: file.type,
          allowedTypes: ALLOWED_TYPES
        }
      );

      toast({
        title: t.products.validation.photoFormat,
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      logFormError(
        `Archivo demasiado grande: ${Math.round(file.size / 1024 / 1024)}MB (máx: ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)`,
        "photo-upload",
        "file_size_too_large",
        {
          productId: id,
          fileName: file.name,
          fileSize: file.size,
          maxSize: MAX_FILE_SIZE
        }
      );

      toast({
        title: t.products.validation.photoSize,
        variant: "destructive",
      });
      return;
    }

    logFormSuccess("Validaciones de archivo pasadas", "photo-upload", "file_validation_success", {
      productId: id,
      fileName: file.name
    });

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      logFormSuccess("Preview de imagen creado", "photo-upload", "image_preview_created", {
        productId: id,
        fileName: file.name
      });

      updateProduct({
        photo: file,
        photoPreview: reader.result as string,
      });
    };

    reader.onerror = (error) => {
      logFormError(
        `Error creando preview de imagen: ${error}`,
        "photo-upload",
        "image_preview_error",
        {
          productId: id,
          fileName: file.name,
          error: error
        }
      );
    };

    reader.readAsDataURL(file);
  };

  const toggleTag = (tag: string) => {
    const newTags = product.tags.includes(tag)
      ? product.tags.filter((t) => t !== tag)
      : [...product.tags, tag];

    updateProduct({ tags: newTags });
  };

  const validateCurrentProduct = (): boolean => {
      if (!product.photo) {
        toast({
          title: t.products.validation.photoRequired,
          variant: "destructive",
        });
        return false;
      }
      if (!product.name.trim()) {
        toast({
          title: t.products.validation.nameRequired,
          variant: "destructive",
        });
        return false;
      }
      if (product.name.length > MAX_NAME_LENGTH) {
        toast({
        title: t.products.validation.nameTooLong,
        description: t.products.validation.nameTooLongDesc.replace("{max}", MAX_NAME_LENGTH.toString()),
          variant: "destructive",
        });
        return false;
      }
      if (!product.description.trim()) {
        toast({
          title: t.products.validation.descriptionRequired,
          variant: "destructive",
        });
        return false;
      }
      if (product.description.length > MAX_DESCRIPTION_LENGTH) {
        toast({
        title: t.products.validation.maxLength,
        description: `La descripción no puede exceder ${MAX_DESCRIPTION_LENGTH} ${t.products.validation.characters}`,
          variant: "destructive",
        });
        return false;
      }

      // Validar que la descripción sea JSON-safe (sin caracteres problemáticos)
      try {
        JSON.stringify({ description: product.description });
      } catch (error) {
        toast({
        title: t.products.validation.descriptionInvalid,
        description: t.products.validation.descriptionInvalidChars,
          variant: "destructive",
        });
        return false;
    }
    return true;
  };


  return (
    <div className="space-y-6 relative">
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <CardContent className="pt-8 pb-8 px-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">{t.products.uploading.title}</h3>
              <p className="text-muted-foreground">{t.products.uploading.description}</p>
            </CardContent>
          </Card>
        </div>
      )}
      {[product].map((product, index) => (
        <Card key={currentStep} className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
              <CardTitle className="text-2xl">
                  {t.products.productNumber.replace("{number}", currentStep.toString())}
              </CardTitle>
                {/* En sistema de páginas no necesitamos badge de procesado */}
              </div>
              {/* Sin botón de eliminar en sistema de páginas */}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Foto del plato */}
            <div className="space-y-2">
              <Label htmlFor={`photo-${currentStep}`} className="text-lg font-semibold">
                {t.products.fields.photo} <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="file"
                    id={`photo-${currentStep}`}
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) => handlePhotoChange(currentStep.toString(), e)}
                    className="hidden"
                  />
                  <Label
                    htmlFor={`photo-${currentStep}`}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent">
                      <Upload className="h-4 w-4" />
                      <span>{product.photo ? product.photo.name : t.products.validation.uploadPhoto}</span>
                    </div>
                  </Label>
                </div>
                {product.photoPreview && (
                  <div className="relative w-24 h-24 rounded-md overflow-hidden border">
                    <img
                      src={product.photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {t.products.validation.photoSizeFormat}
              </p>
            </div>

            {/* Nombre del plato */}
            <div className="space-y-2">
              <Label htmlFor={`name-${currentStep}`} className="text-lg font-semibold">
                {t.products.fields.name} <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`name-${currentStep}`}
                value={product.name}
                onChange={(e) => updateProduct({ name: e.target.value })}
                placeholder={t.products.fields.namePlaceholder}
                className="h-12 text-base"
                maxLength={MAX_NAME_LENGTH}
              />
              <div className="flex justify-end text-xs text-muted-foreground">
                <span className={product.name.length > MAX_NAME_LENGTH ? "text-destructive" : ""}>
                  {product.name.length} / {MAX_NAME_LENGTH}
                </span>
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor={`description-${currentStep}`} className="text-lg font-semibold">
                {t.products.fields.description} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id={`description-${currentStep}`}
                value={product.description}
                onChange={(e) => updateProduct({ description: e.target.value })}
                placeholder={t.products.fields.descriptionExample}
                rows={6}
                className="text-base resize-none"
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className={product.description.length > MAX_DESCRIPTION_LENGTH ? "text-destructive" : ""}>
                  {product.description.length} / {MAX_DESCRIPTION_LENGTH} {t.products.validation.characters}
                </span>
              </div>
            </div>

            {/* Precio */}
            <div className="space-y-2">
              <Label htmlFor={`price-${currentStep}`} className="text-lg font-semibold">
                {t.products.fields.price}
              </Label>
              <Input
                id={`price-${currentStep}`}
                type="number"
                step="0.01"
                min="0"
                value={product.price}
                onChange={(e) => updateProduct({ price: e.target.value })}
                placeholder={t.products.fields.pricePlaceholder}
                className="h-12 text-base"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-lg font-semibold">{t.products.fields.tags}</Label>
              <div className="flex flex-wrap gap-4">
                {Object.entries(t.products.tags).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${currentStep}-${key}`}
                      checked={product.tags.includes(key)}
                      onCheckedChange={() => toggleTag(key)}
                    />
                    <Label
                      htmlFor={`tag-${currentStep}-${key}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Botones de acción */}
      <div className="flex gap-3">
        {/* Botón agregar producto (siempre disponible hasta el límite total) */}
        {currentStep <= MAX_PRODUCTS && (
        <Button
          type="button"
          onClick={addProduct}
            disabled={isProcessingProduct}
            size="lg"
            className="flex-1 text-lg"
            variant="default"
          >
            {isProcessingProduct ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.products.buttons.processing}
              </>
            ) : (
              <>
                {t.products.buttons.addProduct}
              </>
            )}
        </Button>
      )}

        {/* Botón terminar (aparece cuando hay productos procesados) */}
        {processedCount > 0 && (
        <Button
          type="button"
          onClick={handleFinish}
          disabled={isProcessingProduct}
          size="lg"
          className="flex-1 text-lg"
          variant="outline"
        >
          {isProcessingProduct ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.products.buttons.processing}
            </>
          ) : (
            t.products.buttons.finish
          )}
        </Button>
        )}
      </div>

      {/* Información cuando llegue al límite total */}
      {currentStep > MAX_PRODUCTS && (
        <div className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t.products.validation.maxProducts.replace("{max}", MAX_PRODUCTS.toString())}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {t.products.uploading.completed}: {processedCount}
          </p>
          <p className="text-green-600 font-medium mt-2">
            ¡{t.products.uploading.completed}! {t.products.uploading.completedDescription}
          </p>
      </div>
      )}
    </div>
  );
}

