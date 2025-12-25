"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

interface FormNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  isSubmitting?: boolean;
  canGoNext?: boolean;
}

export function FormNavigation({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  isSubmitting = false,
  canGoNext = true,
}: FormNavigationProps) {
  const { t } = useLanguage();
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;
  const buttonLabel = isLastStep ? t.registration.buttons.submit : t.registration.buttons.next;

  return (
    <div className="flex items-center gap-4 pt-6">
      {!isFirstStep && (
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          disabled={isSubmitting}
          className="flex-1 sm:flex-initial"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.registration.buttons.back}
        </Button>
      )}
      <Button
        type="button"
        onClick={onNext}
        disabled={!canGoNext || isSubmitting}
        className={cn(
          "flex-1 sm:flex-initial",
          isFirstStep && "w-full"
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.registration.buttons.submitting}
          </>
        ) : (
          <>
            {buttonLabel}
            {!isLastStep && <ArrowRight className="h-4 w-4" />}
          </>
        )}
      </Button>
    </div>
  );
}

