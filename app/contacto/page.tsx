import { LeadForm } from "@/components/forms/lead-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ContactoPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-start px-4 pt-4">
        <Link href="/">
          <Button variant="ghost" size="icon-sm" className="h-8 w-8 -ml-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
        </Link>
      </div>

      <Card className="w-full max-w-md border-2 border-primary/20">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-balance">Empieza con ChefIAndo</h1>
            <p className="text-muted-foreground text-pretty">
              Déjanos tus datos y te contactamos para activar tu cuenta.
            </p>
          </div>
          <LeadForm />
        </CardContent>
      </Card>
    </main>
  );
}
