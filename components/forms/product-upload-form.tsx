"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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

// ⚙️ CONFIGURACIÓN FÁCIL: Cambia este número para modificar el límite máximo de productos
const MAX_PRODUCTS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_DESCRIPTION_LENGTH = 1000; // Máximo 1000 caracteres para descripción
const MAX_NAME_LENGTH = 100; // Máximo 100 caracteres para nombre

export function ProductUploadForm({ marca }: { marca: string }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { logFormError, logFormWarning, logFormSuccess } = useErrorLogger();
  const router = useRouter();
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingProduct, setIsProcessingProduct] = useState(false);

  // Debug: Ver cambios en el estado de productos
  React.useEffect(() => {
    console.log('📊 Estado de productos cambió:', products.map(p => ({
      id: p.id,
      processed: p.processed,
      hasPhoto: !!p.photo,
      name: p.name?.substring(0, 20) || 'sin nombre'
    })));
  }, [products]);

  const addProduct = async () => {
    console.log('🎯 Click en Adicionar Produto, isProcessingProduct:', isProcessingProduct);

    // Evitar múltiples clicks simultáneos
    if (isProcessingProduct) {
      console.log('⚠️ Ya está procesando, ignorando click');
      return;
    }

    // VALIDACIÓN: Verificar que el último producto tenga todos los campos requeridos
    const lastProduct = products[products.length - 1];
    if (!lastProduct.photo) {
      toast({
        title: t.products.validation.photoRequired,
        variant: "destructive",
      });
      return;
    }
    if (!lastProduct.name.trim()) {
      toast({
        title: t.products.validation.nameRequired,
        variant: "destructive",
      });
      return;
    }
    if (!lastProduct.description.trim()) {
      toast({
        title: t.products.validation.descriptionRequired,
        variant: "destructive",
      });
      return;
    }

    console.log('🔄 Iniciando procesamiento, cambiando estado a true');
    setIsProcessingProduct(true);

    try {
      // El producto ya está validado, proceder con el procesamiento
      if (!lastProduct.processed) {
        console.log('🔄 Procesando producto validado...');

        // Mostrar toast de procesamiento
        toast({
          title: `🖼️ ${t.products.uploading.processingImage}`,
          description: t.products.uploading.processingDescription,
        });

        await processAndSendProduct(lastProduct, products.length - 1);

        // Marcar como procesado para evitar duplicados
        console.log(`🏷️ Marcando producto ${lastProduct.id} como procesado`);
        updateProduct(lastProduct.id, { processed: true });

        // Verificar que se actualizó correctamente
        const updatedProduct = products.find(p => p.id === lastProduct.id);
        console.log(`✅ Estado del producto después de marcar como procesado:`, {
          id: updatedProduct?.id,
          processed: updatedProduct?.processed,
          hasPhoto: !!updatedProduct?.photo,
          name: updatedProduct?.name?.substring(0, 20)
        });
      }
    } finally {
      console.log('✅ Terminó procesamiento, cambiando estado a false');
      setIsProcessingProduct(false);
    }

    // Validar límite total de productos (procesados + no procesados)
    if (products.length >= MAX_PRODUCTS) {
      toast({
        title: t.products.validation.maxProducts,
        description: `Has alcanzado el límite máximo de ${MAX_PRODUCTS} productos.`,
        variant: "destructive",
      });
      return;
    }

    // Agregar producto vacío al formulario local
    const newProduct = {
      id: Date.now().toString(),
      photo: null,
      photoPreview: null,
      name: "",
      description: "",
      price: "",
      tags: [],
      processed: false,
    };

    setProducts([...products, newProduct]);

    console.log(`➕ Nuevo producto agregado. Total: ${products.length + 1}/${MAX_PRODUCTS}`);
  };

  // Función para procesar y enviar un producto individual al webhook
  const processAndSendProduct = async (product: Product, index: number) => {
    try {
      console.log(`🚀 Procesando producto ${index + 1}...`);

      // Validar que tenga todos los datos necesarios
      if (!product.photo) {
        console.warn(`Producto ${index + 1}: Sin foto, omitiendo`);
        return;
      }
      if (!product.name.trim() || !product.description.trim()) {
        console.warn(`Producto ${index + 1}: Datos incompletos, omitiendo`);
        return;
      }

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

      console.log(`📝 Creando registro en Airtable para producto ${index + 1}...`);
      const photoRecordId = await createPhotoRecord(productData, marca);

      if (!photoRecordId) {
        throw new Error(`Error creando registro en Airtable para producto ${index + 1}`);
      }

      // Procesar imagen (comprimir si es necesario)
      let processedFile = product.photo;
      if (product.photo.size > 4 * 1024 * 1024) {
        console.log(`🗜️ Comprimiendo imagen ${index + 1}...`);
        processedFile = await compressImage(product.photo);
      }

      // Convertir a base64
      const buffer = await processedFile.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString("base64");
      const contentType = processedFile.type || "image/jpeg";

      // Preparar payload del webhook (arreglo de 1 producto, compatible con n8n)
      const webhookPayload = {
        marca,
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

      // Enviar al webhook con reintentos
      console.log(`📡 Enviando producto ${index + 1} al webhook...`);

      const response = await fetch("/api/products/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          singleProduct: true, // Flag para indicar que es un producto individual
          productData: webhookPayload
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error en webhook: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Producto ${index + 1} procesado y enviado exitosamente`, result);

      // Procesamiento silencioso - sin feedback individual
      console.log(`✅ Producto "${product.name}" preparado correctamente`);

    } catch (error) {
      console.error(`❌ Error procesando producto ${index + 1}:`, error);

      // Log del error silenciosamente
      const sessionId = await logFormError(
        error,
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
    try {
      const response = await fetch("/api/products/create-record", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productData, marca }),
      });

      if (!response.ok) {
        throw new Error(`Error creando registro: ${response.statusText}`);
      }

      const result = await response.json();
      return result.recordId;
    } catch (error) {
      console.error('Error creando registro en Airtable:', error);
      return null;
    }
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

  const removeProduct = (id: string) => {
    if (products.length === 1) {
      toast({
        title: t.products.error.title,
        description: t.products.validation.minOneProduct,
        variant: "destructive",
      });
      return;
    }
    setProducts(products.filter((p) => p.id !== id));
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(
      products.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
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
    if (!ALLOWED_TYPES.includes(file.type)) {
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

      updateProduct(id, {
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

  const toggleTag = (productId: string, tag: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const newTags = product.tags.includes(tag)
      ? product.tags.filter((t) => t !== tag)
      : [...product.tags, tag];

    updateProduct(productId, { tags: newTags });
  };

  const validateProducts = (): boolean => {
    for (const product of products) {
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
          title: "Nombre demasiado largo",
          description: `El nombre no puede exceder ${MAX_NAME_LENGTH} caracteres`,
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
          title: t.products.validation.maxLength.replace("{max}", MAX_DESCRIPTION_LENGTH.toString()),
          variant: "destructive",
        });
        return false;
      }

      // Validar que la descripción sea JSON-safe (sin caracteres problemáticos)
      try {
        JSON.stringify({ description: product.description });
      } catch (error) {
        toast({
          title: "Error en la descripción",
          description: "La descripción contiene caracteres inválidos. Por favor, revisa y corrige.",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    logFormSuccess("Iniciando validación de productos", "photo-upload", "validation_start", {
      productCount: products.length,
      marca
    });

    if (!validateProducts()) {
      await logFormError(
        "Validación de productos fallida",
        "photo-upload",
        "validation_failed",
        {
          products: products.map(p => ({
            id: p.id,
            hasPhoto: !!p.photo,
            name: p.name,
            descriptionLength: p.description.length
          }))
        }
      );
      return;
    }

    logFormSuccess("Validación exitosa, iniciando upload", "photo-upload", "validation_success");
    setIsSubmitting(true);

    // Logging detallado para debugging
    const debugInfo = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      marca,
      productsCount: unprocessedProducts.length,
      totalProducts: products.length,
      productsWithPhotos: unprocessedProducts.filter(p => p.photo).length,
      totalPhotosSize: unprocessedProducts.reduce((sum, p) => sum + (p.photo?.size || 0), 0),
      photoTypes: unprocessedProducts.map(p => p.photo?.type).filter(Boolean),
      photoNames: unprocessedProducts.map(p => p.photo?.name).filter(Boolean),
      formDataSize: 0, // Se calculará después
    };

    console.log("🚀 Iniciando upload de productos:", debugInfo);

    try {
      logFormSuccess("Preparando datos de productos", "photo-upload", "data_preparation_start");

      // Filtrar solo productos que no han sido procesados individualmente
      const unprocessedProducts = products.filter(p => !p.processed);

      if (unprocessedProducts.length === 0) {
        // Todos los productos ya fueron procesados individualmente
        console.log('✅ Todos los productos ya fueron procesados previamente');
        toast({
          title: "🎉 Posts generados exitosamente",
          description: `Se han procesado ${products.length} productos. ¡Tus posts están listos!`,
        });
        router.push(`/fotos/gracias?marca=${marca}`);
        return;
      }

      console.log(`📦 Procesando ${unprocessedProducts.length} productos no procesados de ${products.length} total`);

      // Preparar y sanitizar datos para enviar
      const sanitizedProducts = unprocessedProducts.map(p => ({
        name: p.name.trim() || '',
        description: p.description.trim() || '',
        price: p.price,
        tags: p.tags.map(tag => tag.trim()).filter(tag => tag.length > 0),
      }));

      logFormSuccess("Datos sanitizados", "photo-upload", "data_sanitization_complete", {
        productCount: sanitizedProducts.length,
        totalTags: sanitizedProducts.reduce((sum, p) => sum + p.tags.length, 0)
      });

      // Validar que los productos sanitizados sean válidos para JSON
      try {
        JSON.stringify(sanitizedProducts);
        logFormSuccess("Validación JSON exitosa", "photo-upload", "json_validation_success");
      } catch (jsonError) {
        console.error("Error en validación JSON de productos:", jsonError, sanitizedProducts);
        await logFormError(
          `Error de validación JSON: ${jsonError instanceof Error ? jsonError.message : 'Error desconocido'}`,
          "photo-upload",
          "json_validation_error",
          { sanitizedProducts, originalError: jsonError }
        );
        throw new Error("Los datos de los productos contienen caracteres inválidos. Por favor, revisa las descripciones.");
      }

      const formData = new FormData();
      formData.append("marca", marca);
      formData.append("products", JSON.stringify(sanitizedProducts));

      // Agregar fotos con validación
      let photosCount = 0;
      unprocessedProducts.forEach((product, index) => {
        if (product.photo) {
          formData.append(`photo_${index}`, product.photo);
          photosCount++;
          console.log(`📸 Foto ${index}: ${product.photo.name} (${Math.round(product.photo.size / 1024)}KB, ${product.photo.type})`);
        }
      });

      console.log(`🚀 Procesando ${photosCount} productos no procesados`);
      console.log(`📦 Estrategia: Procesamiento múltiple al final`);

      // Calcular y mostrar estadísticas de optimización
      const totalSize = unprocessedProducts.reduce((sum, p) => sum + (p.photo?.size || 0), 0);
      const oversizedCount = unprocessedProducts.filter(p => p.photo && p.photo.size > 4 * 1024 * 1024).length;

      if (oversizedCount > 0) {
        console.log(`🗜️ Optimización aplicada: ${oversizedCount} imágenes grandes serán comprimidas automáticamente`);
      }

      console.log(`📊 Estadísticas: ${Math.round(totalSize / 1024 / 1024)}MB total, envío inmediato activado`);

      // Calcular tamaño aproximado del FormData (solo para logging)
      let formDataSize = 0;
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          formDataSize += value.size;
        } else if (typeof value === 'string') {
          formDataSize += value.length;
        }
      }
      console.log(`📦 Tamaño total del FormData: ${Math.round(formDataSize / 1024)}KB`);

      // Enviar a API
      logFormSuccess("Enviando petición a API", "photo-upload", "api_call_start", {
        photosCount,
        productsCount: sanitizedProducts.length,
        marca,
        formDataSize: `${Math.round(formDataSize / 1024)}KB`
      });

      const response = await fetch("/api/products/upload", {
        method: "POST",
        body: formData,
      });

      logFormSuccess("Respuesta de API recibida", "photo-upload", "api_response_received", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      let result;
      try {
        result = await response.json();
        logFormSuccess("Respuesta JSON parseada", "photo-upload", "json_parse_success", result);
      } catch (parseError) {
        console.error("Error parseando respuesta JSON:", parseError, response);
        await logFormError(
          `Error parseando respuesta JSON: ${parseError instanceof Error ? parseError.message : 'Error desconocido'}`,
          "photo-upload",
          "json_parse_error",
          { responseStatus: response.status, responseText: await response.text() }
        );
        throw new Error("Error en la respuesta del servidor. Por favor, intenta de nuevo.");
      }

      if (!response.ok) {
        const errorMessage = result.error || t.products.error.description;
        const errorDetails = result.details ? `

Detalles:
Status: ${result.details.status}
Error del webhook: ${result.details.webhookError}
Tipo de error: ${result.details.errorType || 'Desconocido'}` : '';

        // Log detallado para debugging con información completa
        const errorContext = {
          status: response.status,
          statusText: response.statusText,
          error: result.error,
          details: result.details,
          productsCount: sanitizedProducts.length,
          photosCount,
          marca,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          referrer: document.referrer,
          networkInfo: {
            onLine: navigator.onLine,
            connection: (navigator as any).connection?.effectiveType || 'unknown',
            downlink: (navigator as any).connection?.downlink || 'unknown',
          }
        };

        console.error("❌ Error en envío de productos:", errorContext);

        await logFormError(
          `Error en API de upload: ${errorMessage}`,
          "photo-upload",
          "api_error",
          {
            responseStatus: response.status,
            errorMessage,
            result,
            productsCount: sanitizedProducts.length,
            photosCount,
            marca,
            sanitizedProducts,
            errorContext
          }
        );

        throw new Error(errorMessage + errorDetails);
      }

      console.log("✅ Productos enviados exitosamente con optimizaciones aplicadas:", result);

      // Feedback final como si todo se procesara ahora
      toast({
        title: "🎉 Posts generados exitosamente",
        description: `Se han procesado ${products.length} productos. ¡Tus posts están listos!`,
      });

      // Redirigir a página de agradecimiento
      router.push(`/fotos/gracias?marca=${marca}`);
    } catch (error) {
      console.error("❌ Error fatal al enviar productos:", error);

      // Log del error con el sistema centralizado
      const sessionId = await logFormError(
        error,
        "photo-upload",
        "fatal_upload_error",
        {
          productsCount: unprocessedProducts.length,
          totalProducts: products.length,
          photosCount: unprocessedProducts.filter(p => p.photo).length,
          marca,
          errorMessage: error instanceof Error ? error.message : 'Error desconocido',
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          stack: error instanceof Error ? error.stack : undefined,
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
          networkInfo: typeof navigator !== 'undefined' ? {
            onLine: navigator.onLine,
            connection: (navigator as any).connection?.effectiveType || 'unknown',
            downlink: (navigator as any).connection?.downlink || 'unknown',
          } : {},
          formValidation: {
            hasProducts: unprocessedProducts.length > 0,
            hasPhotos: unprocessedProducts.some(p => p.photo),
            processedProducts: products.filter(p => p.processed).length,
            unprocessedProducts: unprocessedProducts.length,
            allProductsValid: unprocessedProducts.every(p =>
              p.photo &&
              p.name.trim() &&
              p.description.trim() &&
              p.name.length <= 100 &&
              p.description.length <= 1000
            ),
          },
          products: products.map(p => ({
            id: p.id,
            hasPhoto: !!p.photo,
            photoSize: p.photo?.size,
            photoType: p.photo?.type,
            nameLength: p.name.length,
            descriptionLength: p.description.length,
            hasPrice: !!p.price,
            tagsCount: p.tags.length
          }))
        }
      );

      // Capturar información adicional del error para debugging
      const errorContext = {
        productsCount: products.length,
        photosCount: products.filter(p => p.photo).length,
        marca,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        networkInfo: typeof navigator !== 'undefined' ? {
          onLine: navigator.onLine,
          connection: (navigator as any).connection?.effectiveType || 'unknown',
          downlink: (navigator as any).connection?.downlink || 'unknown',
        } : {},
        formValidation: {
          hasProducts: products.length > 0,
          hasPhotos: products.some(p => p.photo),
          allProductsValid: products.every(p =>
            p.photo &&
            p.name.trim() &&
            p.description.trim() &&
            p.name.length <= 100 &&
            p.description.length <= 1000
          ),
        }
      };

      console.error("🔍 Contexto completo del error:", errorContext);

      toast({
        title: t.products.error.title,
        description: `${error instanceof Error ? error.message : t.products.error.description} (Session: ${sessionId})`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
      {products
        .filter(product => {
          console.log(`🔍 Filtrando producto ${product.id}: processed=${product.processed}`);
          return !product.processed;
        }) // Solo mostrar productos no procesados
        .map((product, index) => (
        <Card key={product.id} className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">
                  {t.products.productNumber.replace("{number}", (products.filter(p => !p.processed).indexOf(product) + 1).toString())}
                </CardTitle>
                {product.processed && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    <CheckCircle className="h-3 w-3" />
                    Procesado
                  </span>
                )}
              </div>
              {products.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProduct(product.id)}
                  className="text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Foto del plato */}
            <div className="space-y-2">
              <Label htmlFor={`photo-${product.id}`} className="text-lg font-semibold">
                {t.products.fields.photo} <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="file"
                    id={`photo-${product.id}`}
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) => handlePhotoChange(product.id, e)}
                    className="hidden"
                  />
                  <Label
                    htmlFor={`photo-${product.id}`}
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
              <Label htmlFor={`name-${product.id}`} className="text-lg font-semibold">
                {t.products.fields.name} <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`name-${product.id}`}
                value={product.name}
                onChange={(e) => updateProduct(product.id, { name: e.target.value })}
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
              <Label htmlFor={`description-${product.id}`} className="text-lg font-semibold">
                {t.products.fields.description} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id={`description-${product.id}`}
                value={product.description}
                onChange={(e) => updateProduct(product.id, { description: e.target.value })}
                placeholder={t.products.fields.descriptionExample}
                rows={6}
                className="text-base resize-none"
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className={product.description.length > MAX_DESCRIPTION_LENGTH ? "text-destructive" : ""}>
                  {product.description.length} / {MAX_DESCRIPTION_LENGTH} caracteres
                </span>
              </div>
            </div>

            {/* Precio */}
            <div className="space-y-2">
              <Label htmlFor={`price-${product.id}`} className="text-lg font-semibold">
                {t.products.fields.price}
              </Label>
              <Input
                id={`price-${product.id}`}
                type="number"
                step="0.01"
                min="0"
                value={product.price}
                onChange={(e) => updateProduct(product.id, { price: e.target.value })}
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
                      id={`tag-${product.id}-${key}`}
                      checked={product.tags.includes(key)}
                      onCheckedChange={() => toggleTag(product.id, key)}
                    />
                    <Label
                      htmlFor={`tag-${product.id}-${key}`}
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
        {/* Botón agregar producto (siempre disponible hasta el límite) */}
        {products.filter(p => !p.processed).length < MAX_PRODUCTS && (
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

        {/* Botón terminar (aparece cuando hay al menos 1 producto procesado) */}
        {products.some(p => p.processed) && (
          <Button
            type="button"
            onClick={() => {
              toast({
                title: `🎉 ${t.products.uploading.completed}`,
                description: t.products.uploading.completedDescription,
              });
              router.push(`/fotos/gracias?marca=${marca}`);
            }}
            size="lg"
            className="flex-1 text-lg"
            variant="outline"
          >
            {t.products.buttons.finish}
          </Button>
        )}
      </div>

      {/* Información cuando llegue al límite total */}
      {products.length >= MAX_PRODUCTS && (
        <div className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t.products.validation.maxProducts.replace("5", MAX_PRODUCTS.toString())}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {products.filter(p => p.processed).length} productos procesados • {products.filter(p => !p.processed).length} pendientes
          </p>
          {products.every(p => p.processed) && (
            <p className="text-green-600 font-medium mt-2">
              ¡{t.products.uploading.completed}! {t.products.uploading.completedDescription}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

