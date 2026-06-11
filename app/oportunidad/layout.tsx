import type { Metadata } from "next";
import type { ReactNode } from "react";

// El contenido visible se traduce en el cliente (es/pt) vía useLanguage().
// El metadata es server-side y no conoce el idioma del visitante, así que
// usamos el idioma por defecto del proyecto (es) para título y descripción.
export const metadata: Metadata = {
  title: "Empieza con ChefIAndo",
  description:
    "Contenido profesional para tu restaurante en 5 minutos. Déjanos tus datos y abrimos tu cuenta.",
};

export default function OportunidadLayout({ children }: { children: ReactNode }) {
  return children;
}
