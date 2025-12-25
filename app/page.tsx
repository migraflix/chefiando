"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Sparkles, TrendingUp, Users } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/language-selector"

export default function HomePage() {
  const { t } = useLanguage()

  return (
    <main className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              {t.landing.badge}
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-balance leading-tight">{t.landing.hero.title}</h1>
            <p className="text-xl md:text-2xl text-muted-foreground text-pretty leading-relaxed max-w-2xl mx-auto">
              {t.landing.hero.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="text-lg px-8 py-6" asChild>
                <Link href="/registro">{t.landing.hero.cta}</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent" asChild>
                <Link href="#beneficios">{t.landing.hero.benefits}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y bg-card">
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
      <section id="beneficios" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-balance">{t.landing.benefits.title}</h2>
            <p className="text-xl text-muted-foreground text-pretty leading-relaxed">{t.landing.benefits.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="pt-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">{t.landing.benefits.professional.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{t.landing.benefits.professional.description}</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-secondary transition-colors">
              <CardContent className="pt-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold">{t.landing.benefits.sales.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{t.landing.benefits.sales.description}</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent transition-colors">
              <CardContent className="pt-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-2xl font-bold">{t.landing.benefits.time.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{t.landing.benefits.time.description}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-balance">{t.landing.features.title}</h2>
            <p className="text-xl text-muted-foreground text-pretty leading-relaxed">{t.landing.features.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {t.landing.features.list.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-card">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-lg">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-balance">{t.landing.cta.title}</h2>
              <p className="text-xl text-muted-foreground text-pretty leading-relaxed max-w-2xl mx-auto">
                {t.landing.cta.subtitle}
              </p>
              <Button size="lg" className="text-lg px-8 py-6" asChild>
                <Link href="/registro">{t.landing.cta.button}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="text-2xl font-bold">ChefIAndo</div>
            <p className="text-muted-foreground">{t.landing.footer.description}</p>
            <div className="pt-4 text-sm text-muted-foreground">© 2025 ChefIAndo. {t.landing.footer.rights}</div>
          </div>
        </div>
      </footer>
    </main>
  )
}
