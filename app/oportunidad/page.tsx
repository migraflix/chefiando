"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageSelector } from "@/components/language-selector";
import { useLanguage } from "@/contexts/language-context";
import { OportunidadLeadStep } from "./lead-step";

export default function OportunidadPage() {
  const { t } = useLanguage();
  const o = t.oportunidad;

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center max-w-6xl mx-auto">
          {/* Columna copy */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Image
                src="/chefiando.png"
                alt="ChefIAndo"
                width={160}
                height={50}
                className="h-10 w-auto"
                priority
              />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {o.badge}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-balance leading-tight">
              {o.title}
            </h1>

            <p className="text-lg text-muted-foreground text-pretty leading-relaxed">
              {o.description}
            </p>

            <ul className="space-y-3 text-base">
              {o.bullets.map((bullet, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna form */}
          <Card className="border-2 border-primary/20 shadow-xl">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-balance">{o.formTitle}</h2>
                <p className="text-sm text-muted-foreground text-pretty">
                  {o.formSubtitle}
                </p>
              </div>
              <OportunidadLeadStep ctaLabel={o.cta} labels={o.form} />
              <p className="text-xs text-muted-foreground text-center">
                {o.disclaimer}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
