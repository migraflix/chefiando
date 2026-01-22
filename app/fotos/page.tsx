"use client";

import { useSearchParams } from "next/navigation";
import { ProductUploadForm } from "@/components/forms/product-upload-form";
import { useLanguage } from "@/contexts/language-context";
import { LanguageSelector } from "@/components/language-selector";
import { MAX_PRODUCTS } from "@/lib/constants";

export default function FotosPage() {
  const searchParams = useSearchParams();
  const marca = searchParams.get("marca");
  const currentStep = parseInt(searchParams.get('step') || '1');
  const processedCount = parseInt(searchParams.get('processed') || '0');
  const { t } = useLanguage();

  if (!marca) {
    return (
      <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">{t.products.error.title}</h1>
          <p className="text-muted-foreground">{t.products.error.noRecordId}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">
            {t.products.productNumber.replace("{number}", currentStep.toString())} de {MAX_PRODUCTS}
          </h1>
          <p className="text-muted-foreground text-lg">
            Complete os dados do seu {currentStep}º produto
            {processedCount > 0 && ` (${processedCount} já processados)`}
          </p>
        </div>
        <ProductUploadForm key={`product-${currentStep}`} marca={marca} />
      </div>
    </main>
  );
}

