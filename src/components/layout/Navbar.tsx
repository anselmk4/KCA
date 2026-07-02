"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { getSimulatedSession } from "@/lib/rbac";
import { supabase } from "@/lib/supabase/client";


export function Navbar() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(getSimulatedSession());
    
    const checkAuth = async () => {
      try {
        const { data: { session: activeSession } } = await supabase.auth.getSession();
        if (activeSession?.user) {
          const localSession = getSimulatedSession();
          if (localSession) {
            setSession(localSession);
          }
        } else {
          setSession(null);
        }
      } catch (err) {
        console.error("Error checking auth in Navbar:", err);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const getDashboardLink = () => {
    if (!session) return "/dashboard";
    const r = session.role;
    if (r === "SUPER_ADMIN" || r === "ADMIN" || r === "FINANCE_ADMIN" || r === "ACADEMIC_ADMIN" || r === "SUPPORT_AGENT") {
      return "/admin";
    }
    if (r === "INSTRUCTOR" || r === "TEACHING_ASSISTANT") {
      return "/instructor";
    }
    return "/dashboard";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="ANSELLA Logo" width={150} height={45} className="object-contain h-10 w-auto" priority />
        </Link>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/about" className="transition-colors hover:text-foreground/80 text-foreground/60">
            À propos
          </Link>
          <Link href="/features" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Fonctionnalités
          </Link>
          <Link href="/templates" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Modèle d'académie
          </Link>
          <Link href="/services" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Services
          </Link>
          <Link href="/cases" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Cas d'utilisation
          </Link>
          <Link href="/partners" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Partenaires
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Tarifs
          </Link>
        </nav>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          {loading ? (
            <div className="h-10 w-24 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-md hidden sm:block" />
          ) : session ? (
            <Link 
              href={getDashboardLink()} 
              className="hidden sm:inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-600/90 h-10 px-4 py-2 transition-colors font-semibold"
            >
              Accéder au Dashboard
            </Link>
          ) : (
            <>
              <Link 
                href="/login" 
                className="hidden sm:inline-flex items-center justify-center rounded-md text-sm font-semibold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 h-10 px-4 py-2 transition-colors"
              >
                Connexion
              </Link>
              <Link href="/register" className="hidden sm:inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-600/90 h-10 px-4 py-2 transition-colors">
                S'inscrire
              </Link>
            </>
          )}
          
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
