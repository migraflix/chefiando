"use client";

import { BrandRegistrationForm } from "@/components/forms/brand-registration-form";
import { LanguageSelector } from "@/components/language-selector";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RegistroPage() {
  return (
    <div className="h-screen w-full overflow-hidden relative bg-background">
      {/* Header fijo */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-4 pb-2 safe-area-top bg-background/95 backdrop-blur-sm">
        <Link href="/">
          <Button variant="ghost" size="icon-sm" className="h-8 w-8 -ml-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <LanguageSelector />
      </div>

      {/* Formulario */}
      <div className="h-full pt-14 flex flex-col">
        <BrandRegistrationForm />
      </div>
    </div>
  );
}
