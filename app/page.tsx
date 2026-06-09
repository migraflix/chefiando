"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
// Using inline SVGs to avoid lucide-react version compatibility issues
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/language-selector"
import { APP_VERSION } from "@/lib/version"

export default function HomePage() {
  const { t } = useLanguage()

  return (
    <main className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              {t.landing.badge}
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-balance leading-tight">{t.landing.hero.title}</h1>
            <p className="text-xl md:text-2xl text-muted-foreground text-pretty leading-relaxed max-w-2xl mx-auto">
              {t.landing.hero.description}
            </p>
            <div className="flex justify-center pt-2">
              <Button size="lg" className="text-lg px-10 py-6" asChild>
                <Link href="/contacto">{t.landing.hero.cta}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 border-y bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-primary">500+</div>
              <div className="text-muted-foreground">{t.landing.stats.restaurants}</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-secondary">10K+</div>
              <div className="text-muted-foreground">{t.landing.stats.content}</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-accent">85%</div>
              <div className="text-muted-foreground">{t.landing.stats.engagement}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-10">
            <h2 className="text-4xl md:text-5xl font-bold text-balance">{t.landing.benefits.title}</h2>
            <p className="text-xl text-muted-foreground text-pretty leading-relaxed">{t.landing.benefits.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="pt-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold">{t.landing.benefits.professional.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{t.landing.benefits.professional.description}</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-secondary transition-colors">
              <CardContent className="pt-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold">{t.landing.benefits.sales.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{t.landing.benefits.sales.description}</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent transition-colors">
              <CardContent className="pt-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold">{t.landing.benefits.time.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{t.landing.benefits.time.description}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="text-2xl font-bold">ChefIAndo</div>
            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
              v{APP_VERSION}
            </span>
            <p className="text-muted-foreground">{t.landing.footer.description}</p>
            <div className="pt-4 text-sm text-muted-foreground">© 2025 ChefIAndo. {t.landing.footer.rights}</div>
          </div>
        </div>
      </footer>
    </main>
  )
}
