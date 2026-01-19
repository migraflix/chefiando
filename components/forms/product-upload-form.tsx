"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { sanitizeString } from "@/lib/airtable/utils";

interface Product {
  id: string;
  photo: File | null;
  photoPreview: string | null;
  name: string;
  description: string;
  price: string;
  tags: string[];
}

const MAX_PRODUCTS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_DESCRIPTION_LENGTH = 1000; // Máximo 1000 caracteres para descripción
const MAX_NAME_LENGTH = 100; // Máximo 100 caracteres para nombre

export function ProductUploadForm({ marca }: { marca: string }) {
  const { t } = useLanguage();
  const { toast } = useToast();
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

  const addProduct = () => {
    if (products.length >= MAX_PRODUCTS) {
      toast({
        title: t.products.validation.maxProducts,
        variant: "destructive",
      });
      return;
    }

    setProducts([
      ...products,
      {
        id: Date.now().toString(),
        photo: null,
        photoPreview: null,
        name: "",
        description: "",
        price: "",
        tags: [],
      },
    ]);
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
    if (!file) return;

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: t.products.validation.photoFormat,
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: t.products.validation.photoSize,
        variant: "destructive",
      });
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      updateProduct(id, {
        photo: file,
        photoPreview: reader.result as string,
      });
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
    if (!validateProducts()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar y sanitizar datos para enviar
      const sanitizedProducts = products.map(p => ({
        name: sanitizeString(p.name) || '',
        description: sanitizeString(p.description) || '',
        price: p.price,
        tags: p.tags.map(tag => sanitizeString(tag) || '').filter(tag => tag.length > 0),
      }));

      const formData = new FormData();
      formData.append("marca", marca);
      formData.append("products", JSON.stringify(sanitizedProducts));

      // Agregar fotos
      products.forEach((product, index) => {
        if (product.photo) {
          formData.append(`photo_${index}`, product.photo);
        }
      });

      // Enviar a API
      const response = await fetch("/api/products/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || t.products.error.description;
        const errorDetails = result.details ? `

Detalles:
Status: ${result.details.status}
Error del webhook: ${result.details.webhookError}` : '';
        throw new Error(errorMessage + errorDetails);
      }

      // Redirigir a página de agradecimiento
      router.push(`/fotos/gracias?marca=${marca}`);
    } catch (error) {
      console.error("Error submitting products:", error);
      toast({
        title: t.products.error.title,
        description: error instanceof Error ? error.message : t.products.error.description,
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
      {products.map((product, index) => (
        <Card key={product.id} className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                {t.products.productNumber.replace("{number}", (index + 1).toString())}
              </CardTitle>
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

      {/* Botón agregar producto */}
      {products.length < MAX_PRODUCTS && (
        <Button
          type="button"
          variant="outline"
          onClick={addProduct}
          className="w-full"
        >
          {t.products.buttons.addProduct} ({products.length}/{MAX_PRODUCTS})
        </Button>
      )}

      {/* Botón generar posts */}
      <div className="pt-6">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          size="lg"
          className="w-full text-lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              {t.products.buttons.generating}
            </>
          ) : (
            t.products.buttons.generatePosts
          )}
        </Button>
      </div>
    </div>
  );
}

