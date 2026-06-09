import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { OportunidadLeadStep } from "./lead-step";

export const metadata = {
  title: "Empieza con ChefIAndo",
  description:
    "Contenido profesional para tu restaurante en 5 minutos. Déjanos tus datos y abrimos tu cuenta.",
};

export default function OportunidadPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
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
              Para restaurantes que quieren llenar mesas
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-balance leading-tight">
              Contenido profesional para tu restaurante en 5 minutos
            </h1>

            <p className="text-lg text-muted-foreground text-pretty leading-relaxed">
              Publica todos los días sin contratar fotógrafo, sin escribir el copy
              y sin pelearte con apps. Tú cocinas, ChefIAndo publica.
            </p>

            <ul className="space-y-3 text-base">
              <li className="flex items-start gap-3">
                <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span>Fotos profesionales generadas con IA desde una sola imagen tuya</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span>Copy que vende, no que rellena: pensado para tu mercado</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span>Listo para publicar en Instagram, Facebook y Google</span>
              </li>
            </ul>
          </div>

          {/* Columna form */}
          <Card className="border-2 border-primary/20 shadow-xl">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-balance">
                  Abre tu cuenta gratis
                </h2>
                <p className="text-sm text-muted-foreground text-pretty">
                  Te tomará menos de 2 minutos. En el siguiente paso configuramos tu negocio.
                </p>
              </div>
              <OportunidadLeadStep />
              <p className="text-xs text-muted-foreground text-center">
                Al continuar aceptas que te contactemos por WhatsApp o email.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
