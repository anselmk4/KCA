"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { getSimulatedSession } from "@/lib/rbac";
import { supabase } from "@/lib/supabase/client";
import { ChevronDown } from "lucide-react";
import { 
  MokoLogo, BinanceLogo, OKXLogo, McBuleliLogo, 
  PECBLogo, KivutechLogo, AnadecLogo 
} from "@/components/icons/PartnerLogos";

const partners = [
  { name: "Moko afrika (Freshpay)", desc: "Paiements locaux et solutions de facturation directes en RDC.", logo: <MokoLogo className="w-5 h-5" /> },
  { name: "Binance", desc: "Leader mondial du Web3 et des technologies d'actifs numériques.", logo: <BinanceLogo className="w-5 h-5" /> },
  { name: "OKX", desc: "Infrastructure de trading crypto et de finance décentralisée globale.", logo: <OKXLogo className="w-5 h-5 text-zinc-950 dark:text-white" /> },
  { name: "McBuleli", desc: "Conseil en formation professionnelle et accréditations.", logo: <McBuleliLogo className="w-5 h-5" /> },
  { name: "PECB", desc: "Organisme international de certification professionnelle de premier plan.", logo: <PECBLogo className="w-5 h-5" /> },
  { name: "Kivutech", desc: "Accompagnement technologique et innovation à Goma, RDC.", logo: <KivutechLogo className="w-5 h-5" /> },
  { name: "Anadec RDC", desc: "Agence Nationale pour l'Entrepreneuriat et le développement.", logo: <AnadecLogo className="w-5 h-5" /> }
];

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
          
          <div className="relative group py-2">
            <button className="flex items-center gap-1 transition-colors hover:text-foreground/80 text-foreground/60 focus:outline-none">
              Partenaires
              <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="grid grid-cols-1 gap-2.5">
                {partners.map((p, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      {p.logo}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">{p.name}</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

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
              <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4 hidden sm:block">
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
