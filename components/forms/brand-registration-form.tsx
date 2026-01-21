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
import { useErrorLogger } from "@/lib/error-logger";
import { Loader2, ArrowRight, Camera, Sparkles } from "lucide-react";

const COUNTRIES = [
  "Argentina",
  "Brasil",
  "Chile",
  "Colombia",
  "Ecuador",
  "España",
  "Estados Unidos",
  "México",
  "Perú",
  "Venezuela",
  "Otro",
].sort();

export function BrandRegistrationForm() {
  const [currentSection, setCurrentSection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { logFormError, logFormWarning, logFormSuccess } = useErrorLogger();

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
    try {
      logFormSuccess("Iniciando validación de sección 1", "registration", "section1_validation_start");

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
        const validationErrors = errors;
        await logFormError(
          "Validación de sección 1 fallida",
          "registration",
          "section1_validation_failed",
          { validationErrors, fieldsToValidate }
        );

        toast({
          title: t.registration.error.title,
          description: t.registration.errors.validation,
          variant: "destructive",
        });
        return;
      }

      logFormSuccess("Validación de sección 1 exitosa", "registration", "section1_validation_success");

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

      logFormSuccess("Enviando datos de sección 1 a API", "registration", "section1_api_call", section1Data);

      // Agregar timeout y mejor manejo de errores de red
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

      let response;
      try {
        response = await fetch("/api/brands", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...section1Data,
            status: "Basic Register",
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        // Manejar errores de conexión específicamente
        if (fetchError.name === 'AbortError') {
          throw new Error('La conexión tardó demasiado tiempo. Verifica tu conexión a internet.');
        }

        // Para otros errores de fetch, dar un mensaje más claro
        if (fetchError.message?.includes('Load failed') || fetchError.message?.includes('Failed to fetch')) {
          throw new Error('Error de conexión. Verifica tu conexión a internet e intenta de nuevo.');
        }

        throw fetchError;
      }

      const result = await response.json();

      if (!response.ok) {
        await logFormError(
          `Error en API sección 1: ${result.error || 'Error desconocido'}`,
          "registration",
          "section1_api_error",
          { section1Data, responseStatus: response.status, result }
        );
        throw new Error(result.error || t.registration.error.saveFailed);
      }

      logFormSuccess("Sección 1 guardada exitosamente", "registration", "section1_api_success", {
        recordId: result.recordId,
        section1Data
      });

      setRecordId(result.recordId);
      setCurrentSection(2);

      toast({
        title: t.registration.success.perfect,
        description: t.registration.success.basicSaved,
      });
    } catch (error: any) {
      console.error("Error saving section 1:", error);

      // Determinar el tipo de error para dar mejor feedback
      let userFriendlyMessage = error.message;

      if (error.message?.includes('Load failed') || error.message?.includes('Failed to fetch')) {
        userFriendlyMessage = 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.';
      } else if (error.message?.includes('timeout') || error.message?.includes('aborted')) {
        userFriendlyMessage = 'La conexión tardó demasiado. Intenta de nuevo.';
      } else if (error.message?.includes('JSON')) {
        userFriendlyMessage = 'Los datos contienen caracteres inválidos. Revisa la información e intenta de nuevo.';
      }

      // Log del error con contexto completo
      const sessionId = await logFormError(
        error,
        "registration",
        "section1_save_error",
        {
          formData: watch(),
          currentSection: 1,
          recordId,
          errorMessage: error.message,
          userFriendlyMessage,
          errorStack: error.stack
        }
      );

      toast({
        title: t.registration.error.title,
        description: `${userFriendlyMessage} (Session: ${sessionId})`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
    } catch (error: any) {
      console.error("Error general en sección 1:", error);
      // Este catch maneja errores de validación que no sean del API call
      const sessionId = await logFormError(
        error,
        "registration",
        "section1_general_error",
        {
          formData: watch(),
          currentSection: 1,
          errorMessage: error.message
        }
      );

      toast({
        title: t.registration.error.title,
        description: `${error.message} (Session: ${sessionId})`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validar y actualizar Sección 2 (Status: New)
  const handleSection2 = async () => {
    try {
      logFormSuccess("Iniciando validación de sección 2", "registration", "section2_validation_start");

      const fieldsToValidate: (keyof BrandFormData)[] = ["instagram", "descripcion"];

      const isValid = await trigger(fieldsToValidate);
      if (!isValid) {
        const validationErrors = errors;
        await logFormError(
          "Validación de sección 2 fallida",
          "registration",
          "section2_validation_failed",
          { validationErrors, fieldsToValidate }
        );
        return;
      }

      if (!recordId) {
        await logFormWarning("No hay recordId para sección 2", "registration", "section2_no_record_id");
        toast({
          title: "Error",
          description: t.registration.errors.noRecord,
          variant: "destructive",
        });
        return;
      }

      logFormSuccess("Validación de sección 2 exitosa", "registration", "section2_validation_success");

    setIsSubmitting(true);
    try {
      const formData = watch();
      const section2Data = {
        instagram: formData.instagram,
        descripcion: formData.descripcion,
      };

      logFormSuccess("Actualizando campos de sección 2", "registration", "section2_fields_update", section2Data);

      // Actualizar campos
      const updateFieldsResponse = await fetch(`/api/brands/${recordId}/fields`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(section2Data),
      });

      if (!updateFieldsResponse.ok) {
        await logFormError(
          "Error actualizando campos de sección 2",
          "registration",
          "section2_fields_api_error",
          { recordId, section2Data, responseStatus: updateFieldsResponse.status }
        );
        throw new Error(t.registration.error.saveFailed);
      }

      logFormSuccess("Campos de sección 2 actualizados", "registration", "section2_fields_success");

      // Actualizar status a "New"
      logFormSuccess("Actualizando status a 'New'", "registration", "section2_status_update");
      const updateStatusResponse = await fetch(`/api/brands/${recordId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "New" }),
      });

      if (!updateStatusResponse.ok) {
        await logFormError(
          "Error actualizando status de sección 2",
          "registration",
          "section2_status_api_error",
          { recordId, responseStatus: updateStatusResponse.status }
        );
        throw new Error(t.registration.error.saveFailed);
      }

      logFormSuccess("Status actualizado a 'New'", "registration", "section2_status_success");
      logFormSuccess("Sección 2 completada exitosamente", "registration", "section2_complete", { recordId });

      setCurrentSection(3);

      toast({
        title: "¡Excelente!",
        description: t.registration.success.additionalSaved,
      });
    } catch (error: any) {
      console.error("Error saving section 2:", error);

      // Log del error con contexto completo
      const sessionId = await logFormError(
        error,
        "registration",
        "section2_save_error",
        {
          formData: watch(),
          currentSection: 2,
          recordId,
          section2Data: {
            instagram: watch("instagram"),
            descripcion: watch("descripcion")
          },
          errorMessage: error.message,
          errorStack: error.stack
        }
      );

      toast({
        title: "Error",
        description: `${error.message} (Session: ${sessionId})`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
    } catch (error: any) {
      console.error("Error general en sección 2:", error);
      // Este catch maneja errores de validación que no sean del API call
      const sessionId = await logFormError(
        error,
        "registration",
        "section2_general_error",
        {
          formData: watch(),
          currentSection: 2,
          recordId,
          errorMessage: error.message
        }
      );

      toast({
        title: t.registration.error.title,
        description: `${error.message} (Session: ${sessionId})`,
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
        title: t.registration.error.title,
        description: t.registration.errors.noRecord,
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
          {currentSection === 1 && t.registration.sections.basic}
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
                  {t.registration.labels.ownerName}
                </Label>
                <Input
                  id="emprendedor"
                  placeholder={t.registration.placeholders.name}
                  {...register("emprendedor")}
                  className="h-11 text-base"
                />
                {errors.emprendedor && (
                  <p className="text-xs text-destructive">{errors.emprendedor.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="negocio" className="text-sm font-medium">
                  {t.registration.labels.businessName} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="negocio"
                  placeholder={t.registration.placeholders.business}
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
                  {t.registration.labels.email}
                </Label>
                <Input
                  id="correo"
                  type="email"
                  placeholder={t.registration.placeholders.email}
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
                  {t.registration.labels.whatsapp} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder={t.registration.placeholders.whatsapp}
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
                  {t.registration.labels.city}
                </Label>
                <Input
                  id="ciudad"
                  placeholder={t.registration.placeholders.city}
                  {...register("ciudad")}
                  className="h-11 text-base"
                />
                {errors.ciudad && (
                  <p className="text-xs text-destructive">{errors.ciudad.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pais" className="text-sm font-medium">
                  {t.registration.labels.country}
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
                    <SelectValue placeholder={t.registration.placeholders.country} />
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
                <p className="text-sm text-muted-foreground mb-2">
                  {t.registration.questions.instagram}
                </p>
                <Input
                  id="instagram"
                  type="url"
                  placeholder={t.registration.placeholders.instagram}
                  {...register("instagram")}
                  className="h-11 text-base"
                  inputMode="url"
                />
                {errors.instagram && (
                  <p className="text-xs text-destructive">{errors.instagram.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div>
                  <Label htmlFor="descripcion" className="text-sm font-medium block mb-1">
                    {t.registration.questions.story}
                  </Label>
                </div>
                <Textarea
                  id="descripcion"
                  placeholder={t.registration.placeholders.story}
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
                    <span>{t.registration.photosSection.analyzing}</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-3">
                      {t.registration.photosSection.title}
                    </h3>
                    <p className="text-muted-foreground text-base leading-relaxed">
                      {t.registration.photosSection.description}
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
