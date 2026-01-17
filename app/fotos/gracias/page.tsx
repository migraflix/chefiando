"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { LanguageSelector } from "@/components/language-selector";
import { CheckCircle2 } from "lucide-react";

export default function GraciasPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const marca = searchParams.get("marca");
  const { t, language, locationInfo } = useLanguage();

  const handleGoToBrand = () => {
    if (marca) {
      router.push(`/marca/ver/${marca}`);
    }
  };

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="fixed top-4 right-4 z-50 bg-background/80 backdrop-blur-sm border rounded-lg p-2 shadow-lg">
        <LanguageSelector />
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <CardContent className="pt-12 pb-12 px-8">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">{t.products.thanks.title}</h1>
            <h2 className="text-2xl font-semibold text-muted-foreground mb-6">
              {t.products.thanks.subtitle}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t.products.thanks.description}
            </p>
            {marca && (
              <Button
                onClick={handleGoToBrand}
                size="lg"
                className="text-lg px-8"
              >
                {t.products.thanks.button}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}



