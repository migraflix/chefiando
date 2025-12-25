"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { brandRegistrationSchema, type BrandFormData } from "@/lib/validation/brand-schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { Loader2, ArrowRight, Camera, Sparkles } from "lucide-react";

const COUNTRIES = [
  "Perú",
  "Colombia",
  "Chile",
  "Argentina",
  "México",
  "Ecuador",
  "Venezuela",
  "España",
  "Estados Unidos",
  "Brasil",
  "Otro",
];

export function BrandRegistrationForm() {
  const [currentSection, setCurrentSection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
    setValue,
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandRegistrationSchema),
    mode: "onChange",
    defaultValues: {
      emprendedor: "",
      negocio: "",
      correo: "",
      ciudad: "",
      pais: "",
      whatsapp: "",
      instagram: "",
      descripcion: "",
    },
  });

  // Validar y guardar Sección 1 (Basic Register)
  const handleSection1 = async () => {
    const fieldsToValidate: (keyof BrandFormData)[] = [
      "emprendedor",
      "negocio",
      "correo",
      "ciudad",
      "pais",
      "whatsapp",
    ];

    const isValid = await trigger(fieldsToValidate);
    if (!isValid) {
      toast({
        title: "Error de validación",
        description: "Por favor, completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = watch();
      const section1Data = {
        emprendedor: formData.emprendedor,
        negocio: formData.negocio,
        correo: formData.correo,
        ciudad: formData.ciudad,
        pais: formData.pais,
        whatsapp: formData.whatsapp,
      };

      const response = await fetch("/api/brands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...section1Data,
          status: "Basic Register",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al guardar la información básica");
      }

      setRecordId(result.recordId);
      setCurrentSection(2);

      toast({
        title: "¡Perfecto!",
        description: "Información básica guardada",
      });
    } catch (error: any) {
      console.error("Error saving section 1:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la información",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validar y actualizar Sección 2 (Status: New)
  const handleSection2 = async () => {
    const fieldsToValidate: (keyof BrandFormData)[] = ["instagram", "descripcion"];

    const isValid = await trigger(fieldsToValidate);
    if (!isValid) {
      return;
    }

    if (!recordId) {
      toast({
        title: "Error",
        description: "No se encontró el registro. Por favor, recarga la página.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = watch();
      const section2Data = {
        instagram: formData.instagram,
        descripcion: formData.descripcion,
      };

      // Actualizar campos
      const updateFieldsResponse = await fetch(`/api/brands/${recordId}/fields`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(section2Data),
      });

      if (!updateFieldsResponse.ok) {
        throw new Error("Error al actualizar los campos");
      }

      // Actualizar status a "New"
      const updateStatusResponse = await fetch(`/api/brands/${recordId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "New" }),
      });

      if (!updateStatusResponse.ok) {
        throw new Error("Error al actualizar el status");
      }

      setCurrentSection(3);

      toast({
        title: "¡Excelente!",
        description: "Información adicional guardada",
      });
    } catch (error: any) {
      console.error("Error saving section 2:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la información",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Continuar a subida de fotos
  const handleSection3 = () => {
    if (!recordId) {
      toast({
        title: "Error",
        description: "No se encontró el registro",
        variant: "destructive",
      });
      return;
    }
    router.push(`/fotos?marca=${recordId}`);
  };

  const selectedCountry = watch("pais");
  const isOtherCountry = selectedCountry === "Otro";

  return (
    <form className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-2 pb-3 bg-background">
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`flex-1 h-2 rounded-full transition-colors ${
                step === currentSection
                  ? "bg-primary"
                  : step < currentSection
                  ? "bg-primary/50"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
        <h2 className="text-xl font-semibold">
          {currentSection === 1 && "Información Básica"}
          {currentSection === 2 && "Redes Sociales"}
          {currentSection === 3 && "Subir Fotos"}
        </h2>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0 bg-background">
          {/* Sección 1: Información Básica */}
          {currentSection === 1 && (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="space-y-1.5">
                <Label htmlFor="emprendedor" className="text-sm font-medium">
                  Nombre del Propietario
                </Label>
                <Input
                  id="emprendedor"
                  placeholder="Tu nombre completo"
                  {...register("emprendedor")}
                  className="h-11 text-base"
                />
                {errors.emprendedor && (
                  <p className="text-xs text-destructive">{errors.emprendedor.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="negocio" className="text-sm font-medium">
                  Nombre del Negocio <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="negocio"
                  placeholder="Nombre de tu restaurante"
                  {...register("negocio")}
                  className="h-11 text-base"
                  required
                />
                {errors.negocio && (
                  <p className="text-xs text-destructive">{errors.negocio.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="correo" className="text-sm font-medium">
                  Correo Electrónico
                </Label>
                <Input
                  id="correo"
                  type="email"
                  placeholder="tu@email.com"
                  {...register("correo")}
                  className="h-11 text-base"
                  inputMode="email"
                />
                {errors.correo && (
                  <p className="text-xs text-destructive">{errors.correo.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="whatsapp" className="text-sm font-medium">
                  WhatsApp <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="+51987654321"
                  {...register("whatsapp")}
                  className="h-11 text-base"
                  inputMode="tel"
                  required
                />
                {errors.whatsapp && (
                  <p className="text-xs text-destructive">{errors.whatsapp.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ciudad" className="text-sm font-medium">
                  Ciudad
                </Label>
                <Input
                  id="ciudad"
                  placeholder="Tu ciudad"
                  {...register("ciudad")}
                  className="h-11 text-base"
                />
                {errors.ciudad && (
                  <p className="text-xs text-destructive">{errors.ciudad.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pais" className="text-sm font-medium">
                  País
                </Label>
                <Select
                  value={isOtherCountry ? "Otro" : selectedCountry || ""}
                  onValueChange={(value) => {
                    if (value === "Otro") {
                      setValue("pais", "Otro");
                    } else {
                      setValue("pais", value);
                    }
                  }}
                >
                  <SelectTrigger id="pais" className="h-11 text-base">
                    <SelectValue placeholder="Selecciona tu país" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.pais && (
                  <p className="text-xs text-destructive">{errors.pais.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Sección 2: Instagram y Historia */}
          {currentSection === 2 && (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="space-y-1.5">
                <Label htmlFor="instagram" className="text-sm font-medium">
                  Instagram
                </Label>
                <Input
                  id="instagram"
                  type="url"
                  placeholder="https://www.instagram.com/tu_restaurante/"
                  {...register("instagram")}
                  className="h-11 text-base"
                  inputMode="url"
                />
                {errors.instagram && (
                  <p className="text-xs text-destructive">{errors.instagram.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="descripcion" className="text-sm font-medium">
                  Historia del Emprendedor
                </Label>
                <Textarea
                  id="descripcion"
                  placeholder="Cuéntanos sobre tu restaurante, su historia, especialidades..."
                  {...register("descripcion")}
                  rows={8}
                  className="text-base resize-none"
                  maxLength={1000}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{errors.descripcion?.message}</span>
                  <span>{watch("descripcion")?.length || 0} / 1000</span>
                </div>
              </div>
            </div>
          )}

          {/* Sección 3: Fotos */}
          {currentSection === 3 && (
            <div className="space-y-6 max-w-md mx-auto text-center py-8">
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>Estamos analizando tus últimas publicaciones...</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-3">
                      Es momento de subir tus fotos
                    </h3>
                    <p className="text-muted-foreground text-base leading-relaxed">
                      Comparte las mejores imágenes de tus platillos para crear contenido increíble
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Footer con botones */}
      <div className="flex-shrink-0 px-4 pb-4 pt-4 border-t bg-background safe-area-bottom">
        <div className="max-w-md mx-auto">
            {currentSection === 1 && (
              <Button
                type="button"
                onClick={handleSection1}
                disabled={isSubmitting}
                className="w-full h-12 text-base font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}

            {currentSection === 2 && (
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentSection(1)}
                  className="flex-1 h-12"
                >
                  Atrás
                </Button>
                <Button
                  type="button"
                  onClick={handleSection2}
                  disabled={isSubmitting}
                  className="flex-1 h-12 text-base font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      Continuar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {currentSection === 3 && (
              <Button
                type="button"
                onClick={handleSection3}
                className="w-full h-12 text-base font-semibold"
              >
                Subir Fotos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
        </div>
      </div>
    </form>
  );
}
