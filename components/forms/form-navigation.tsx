"use client";

import { Button } from "@/components/ui/button";
// Using inline SVGs for arrow and loader icons
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
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
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
            <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t.registration.buttons.submitting}
          </>
        ) : (
          <>
            {buttonLabel}
            {!isLastStep && <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>}
          </>
        )}
      </Button>
    </div>
  );
}

