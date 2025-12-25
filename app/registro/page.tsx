"use client";

import { BrandRegistrationForm } from "@/components/forms/brand-registration-form";
import { useLanguage } from "@/contexts/language-context";
import { LanguageSelector } from "@/components/language-selector";

export default function RegistroPage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">{t.registration.title}</h1>
          <p className="text-muted-foreground">{t.registration.subtitle}</p>
        </div>
        <BrandRegistrationForm />
      </div>
    </main>
  );
}
