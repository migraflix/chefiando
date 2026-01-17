"use client";

import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Check, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LanguageSelector } from "@/components/language-selector";

interface Brand {
  id: string;
  fields: {
    Negocio?: string;
    "Upload Fotos Link"?: string;
    Location?: string;
    País?: string;
    Country?: string;
    Idioma?: string;
    Language?: string;
    [key: string]: any;
  };
}

export function BrandsListClient() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchBrands() {
      setLoading(true);
      try {
        console.log("🔍 [CLIENT] Iniciando fetch a /api/brands");
        const response = await fetch("/api/brands", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("📥 [CLIENT] Respuesta recibida:", {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { raw: errorText };
          }

          console.error("❌ [CLIENT] Error en respuesta:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });

          throw new Error(
            errorData.error ||
              errorData.details ||
              `Error ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("✅ [CLIENT] Datos recibidos:", {
          recordsCount: data.records?.length || 0,
          hasRecords: !!(data.records && data.records.length > 0),
        });

        setBrands(data.records || []);
      } catch (error) {
        console.error("❌ [CLIENT] Error fetching brands:", error);
        toast({
          title: t.brands.error,
          description:
            error instanceof Error ? error.message : t.brands.errorDescription,
          variant: "destructive",
        });
        // Asegurar que brands esté vacío en caso de error
        setBrands([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBrands();
  }, [toast, t]);

  const copyToClipboard = async (brandId: string) => {
    const url = `${window.location.origin}/marca/ver/${brandId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(brandId);
      toast({
        title: t.brands.copied,
        description: t.brands.copiedDescription,
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  const shareOnWhatsApp = (brandId: string) => {
    const url = `${window.location.origin}/marca/ver/${brandId}`;
    const text = t.brands.shareText;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
      "_blank",
      "width=600,height=400"
    );
  };

  // Obtener lista única de países
  const countries = useMemo(() => {
    const countrySet = new Set<string>();
    brands.forEach((brand) => {
      const country = brand.fields.País;
      if (country && typeof country === "string") {
        countrySet.add(country);
      }
    });
    return Array.from(countrySet).sort();
  }, [brands]);

  // Obtener lista única de idiomas.
  const languages = useMemo(() => {
    const languageSet = new Set<string>();
    brands.forEach((brand) => {
      const language = brand.fields.Idioma || brand.fields.Language;
      if (language && typeof language === "string") {
        languageSet.add(language);
      }
    });
    return Array.from(languageSet).sort();
  }, [brands]);

  // Filtrar marcas según búsqueda, país e idioma
  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      // Filtro por término de búsqueda
      const searchMatch =
        searchTerm === "" ||
        (brand.fields.Negocio?.toLowerCase().includes(
          searchTerm.toLowerCase()
        ) ??
          false);

      // Filtro por país 2
      const country = brand.fields.País;
      const countryMatch =
        selectedCountry === "all" || country === selectedCountry;

      // Filtro por idioma
      const language = brand.fields.Idioma || brand.fields.Language;
      const languageMatch =
        selectedLanguage === "all" || language === selectedLanguage;

      return searchMatch && countryMatch && languageMatch;
    });
  }, [brands, searchTerm, selectedCountry, selectedLanguage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">{t.brands.title}</h1>
              <p className="mt-2 text-muted-foreground">{t.brands.subtitle}</p>
            </div>
            <LanguageSelector />
          </div>
          <div className="text-center text-muted-foreground">
            {t.brands.loading}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-balance text-4xl font-bold">
              {t.brands.title}
            </h1>
            <p className="mt-2 text-pretty text-muted-foreground">
              {t.brands.subtitle}
            </p>
          </div>
          <LanguageSelector />
        </div>

        {/* Filtros de búsqueda, país e idioma*/}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar marcas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Todos los países" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los países</SelectItem>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Todos los idiomas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los idiomas</SelectItem>
              {languages.map((language) => (
                <SelectItem key={language} value={language}>
                  {language}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {brands.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">{t.brands.noBrands}</p>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-4 text-left font-semibold">
                      {t.brands.table.name}
                    </th>
                    <th className="p-4 text-right font-semibold">
                      {t.brands.table.actions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBrands.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="p-8 text-center text-muted-foreground"
                      >
                        No se encontraron marcas con los filtros seleccionados
                      </td>
                    </tr>
                  ) : (
                    filteredBrands.map((brand) => (
                      <tr
                        key={brand.id}
                        className="border-b last:border-0 hover:bg-muted/30"
                      >
                        <td className="p-4">
                          <div className="font-medium">
                            {brand.fields.Negocio || t.brands.table.noName}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(brand.id)}
                              className="gap-2"
                            >
                              {copiedId === brand.id ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  {t.brands.table.copied}
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4" />
                                  {t.brands.table.copy}
                                </>
                              )}
                            </Button>

                            <div className="h-4 w-px bg-border" />

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => shareOnWhatsApp(brand.id)}
                              className="gap-2"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                              </svg>
                              WhatsApp
                            </Button>

                            <Button asChild variant="outline" size="sm">
                              <a href={`/fotos?marca=${brand.id}`}>
                                {t.brands.table.uploadPhotos}
                              </a>
                            </Button>

                            <Button asChild>
                              <a href={`/marca/ver/${brand.id}`}>
                                {t.brands.table.review}
                              </a>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
