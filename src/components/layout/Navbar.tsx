import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { GraduationCap } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <GraduationCap className="h-8 w-8 text-blue-600" />
          <span className="font-bold text-xl hidden sm:inline-block">
            ANSELLA
          </span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/about" className="transition-colors hover:text-foreground/80 text-foreground/60">
            À propos
          </Link>
          <Link href="/#features" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Fonctionnalités
          </Link>
          <Link href="/#templates" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Modèle d'académie
          </Link>
          <Link href="/services" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Services
          </Link>
          <Link href="/cases" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Cas d'utilisation
          </Link>
          <Link href="/#pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Tarifs
          </Link>
        </nav>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4 hidden sm:block">
            Espace Instructeur
          </Link>
          <Link href="/register" className="hidden sm:inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-600/90 h-10 px-4 py-2 transition-colors">
            S'inscrire
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
