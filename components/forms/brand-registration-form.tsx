"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { brandRegistrationSchema, type BrandFormData } from "@/lib/validation/brand-schema";
import { ProgressBar } from "./progress-bar";
import { QuestionStep } from "./question-step";
import { FormNavigation } from "./form-navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";

const TOTAL_STEPS = 7;

// Lista de países
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otherCountry, setOtherCountry] = useState("");
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
  });

  // Guardar progreso en localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("brandRegistrationForm");
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        Object.keys(data).forEach((key) => {
          if (data[key]) {
            setValue(key as keyof BrandFormData, data[key]);
          }
        });
      } catch (error) {
        console.error("Error loading saved form data:", error);
      }
    }
  }, [setValue]);

  // Guardar datos en localStorage cuando cambian
  const formData = watch();
  useEffect(() => {
    localStorage.setItem("brandRegistrationForm", JSON.stringify(formData));
  }, [formData]);

  const nextStep = async () => {
    // Validar campo actual antes de avanzar
    const fieldToValidate = getFieldForStep(currentStep);
    if (fieldToValidate) {
      const isValid = await trigger(fieldToValidate as keyof BrandFormData);
      if (!isValid) {
        return;
      }
    }

    if (currentStep < TOTAL_STEPS) {
      // Limpiar el campo actual al avanzar para mejor UX
      // Esto hace que el campo quede limpio visualmente al avanzar
      if (fieldToValidate) {
        const fieldName = fieldToValidate as keyof BrandFormData;
        // Limpiar todos los campos opcionales al avanzar
        // Los obligatorios se mantienen porque ya fueron validados
        if (fieldName === "emprendedor" || fieldName === "ciudad" || fieldName === "pais" || 
            fieldName === "instagram" || fieldName === "descripcion") {
          setValue(fieldName, "" as any);
          // También limpiar el estado local de país "Otro"
          if (fieldName === "pais") {
            setOtherCountry("");
          }
        }
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: BrandFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/brands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al crear el registro");
      }

      // Limpiar localStorage
      localStorage.removeItem("brandRegistrationForm");

      // Mostrar éxito y redirigir
      toast({
        title: t.registration.success.title,
        description: t.registration.success.description,
      });

      router.push(`/fotos?marca=${result.recordId}`);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: t.registration.error.title,
        description: error instanceof Error ? error.message : t.registration.error.description,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (currentStep < TOTAL_STEPS) {
        nextStep();
      } else {
        handleSubmit(onSubmit)();
      }
    }
  };

  const renderQuestion = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Label htmlFor="emprendedor" className="text-2xl font-semibold">
              {t.registration.questions.name}
            </Label>
            <Input
              id="emprendedor"
              placeholder={t.registration.placeholders.name}
              {...register("emprendedor")}
              onKeyDown={handleKeyPress}
              className="h-12 text-base"
            />
            {errors.emprendedor && (
              <p className="text-sm text-destructive">{errors.emprendedor.message}</p>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Label htmlFor="negocio" className="text-2xl font-semibold">
              {t.registration.questions.business} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="negocio"
              placeholder={t.registration.placeholders.business}
              {...register("negocio")}
              onKeyDown={handleKeyPress}
              className="h-12 text-base"
            />
            {errors.negocio && (
              <p className="text-sm text-destructive">{errors.negocio.message}</p>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Label htmlFor="ciudad" className="text-2xl font-semibold">
              {t.registration.questions.city}
            </Label>
            <Input
              id="ciudad"
              placeholder={t.registration.placeholders.city}
              {...register("ciudad")}
              onKeyDown={handleKeyPress}
              className="h-12 text-base"
            />
            {errors.ciudad && (
              <p className="text-sm text-destructive">{errors.ciudad.message}</p>
            )}
          </div>
        );

      case 4:
        const selectedCountry = watch("pais");
        const isOtherCountry = selectedCountry === "Otro";
        
        return (
          <div className="space-y-4">
            <Label htmlFor="pais" className="text-2xl font-semibold">
              {t.registration.questions.country}
            </Label>
            <Select
              value={isOtherCountry ? "Otro" : selectedCountry || ""}
              onValueChange={(value) => {
                if (value === "Otro") {
                  setValue("pais", "Otro");
                  setOtherCountry("");
                } else {
                  setValue("pais", value);
                  setOtherCountry("");
                }
              }}
            >
              <SelectTrigger id="pais" className="h-12 text-base">
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
            {isOtherCountry && (
              <Input
                placeholder={t.registration.placeholders.country}
                value={otherCountry}
                onChange={(e) => {
                  const value = e.target.value;
                  setOtherCountry(value);
                  setValue("pais", value || "Otro");
                }}
                onKeyDown={handleKeyPress}
                className="h-12 text-base"
              />
            )}
            {errors.pais && (
              <p className="text-sm text-destructive">{errors.pais.message}</p>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <Label htmlFor="whatsapp" className="text-2xl font-semibold">
              {t.registration.questions.whatsapp}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="whatsapp"
              type="tel"
              placeholder={t.registration.placeholders.whatsapp}
              {...register("whatsapp")}
              onKeyDown={handleKeyPress}
              className="h-12 text-base"
            />
            {errors.whatsapp && (
              <p className="text-sm text-destructive">{errors.whatsapp.message}</p>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <Label htmlFor="instagram" className="text-2xl font-semibold">
              {t.registration.questions.instagram}
            </Label>
            <Input
              id="instagram"
              type="url"
              placeholder={t.registration.placeholders.instagram}
              {...register("instagram")}
              onKeyDown={handleKeyPress}
              className="h-12 text-base"
            />
            {errors.instagram && (
              <p className="text-sm text-destructive">{errors.instagram.message}</p>
            )}
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <Label htmlFor="descripcion" className="text-2xl font-semibold">
              {t.registration.questions.story}
            </Label>
            <Textarea
              id="descripcion"
              placeholder={t.registration.placeholders.story}
              {...register("descripcion")}
              rows={6}
              className="text-base resize-none"
              maxLength={1000}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{errors.descripcion?.message}</span>
              <span>
                {watch("descripcion")?.length || 0} / 1000 {t.language === "es" ? "caracteres" : "caracteres"}
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getFieldForStep = (step: number): string | null => {
    const fieldMap: Record<number, keyof BrandFormData> = {
      1: "emprendedor",
      2: "negocio",
      3: "ciudad",
      4: "pais",
      5: "whatsapp",
      6: "instagram",
      7: "descripcion",
    };
    return fieldMap[step] || null;
  };

  const canGoNext = () => {
    const field = getFieldForStep(currentStep);
    if (!field) return true;

    // Para campos obligatorios, verificar que tengan valor
    if (field === "negocio" || field === "whatsapp") {
      const value = watch(field);
      return !!value && !errors[field];
    }

    // Para campos opcionales, solo verificar que no haya errores
    return !errors[field];
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-2xl mx-auto">
      <div className="mb-8">
        <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
      </div>

      <QuestionStep>
        <div className="min-h-[300px] flex flex-col justify-center">
          {renderQuestion()}
        </div>
      </QuestionStep>

      <FormNavigation
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        onNext={currentStep < TOTAL_STEPS ? nextStep : handleSubmit(onSubmit)}
        onPrev={prevStep}
        isSubmitting={isSubmitting}
        canGoNext={canGoNext()}
      />
    </form>
  );
}

