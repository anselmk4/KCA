import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { getSimulatedSession } from "@/lib/rbac";
import { supabase } from "@/lib/supabase/client";
import { 
  MokoLogo, BinanceLogo, OKXLogo, McBuleliLogo, 
  PECBLogo, KivutechLogo, AnadecLogo 
} from "@/components/icons/PartnerLogos";

const partners = [
  { name: "Moko afrika (Freshpay)", logo: <MokoLogo className="w-4 h-4" /> },
  { name: "Binance", logo: <BinanceLogo className="w-4 h-4" /> },
  { name: "OKX", logo: <OKXLogo className="w-4 h-4 text-zinc-950 dark:text-white" /> },
  { name: "McBuleli", logo: <McBuleliLogo className="w-4 h-4" /> },
  { name: "PECB", logo: <PECBLogo className="w-4 h-4" /> },
  { name: "Kivutech", logo: <KivutechLogo className="w-4 h-4" /> },
  { name: "Anadec RDC", logo: <AnadecLogo className="w-4 h-4" /> }
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [partnersOpen, setPartnersOpen] = useState(false);

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
        console.error("Error in MobileMenu auth:", err);
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
    <div className="md:hidden">
      <button
        onClick={() => { setOpen(!open); if (open) setPartnersOpen(false); }}
        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Menu"
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {open && (
        <div className="absolute top-16 left-0 right-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-xl z-50 animate-in slide-in-from-top-2">
          <nav className="flex flex-col p-6 space-y-4 text-left">
            <Link href="/about" onClick={() => setOpen(false)} className="text-lg font-medium py-2 border-b border-zinc-100 dark:border-zinc-800">
              À propos
            </Link>
            <Link href="/features" onClick={() => setOpen(false)} className="text-lg font-medium py-2 border-b border-zinc-100 dark:border-zinc-800">
              Fonctionnalités
            </Link>
            <Link href="/templates" onClick={() => setOpen(false)} className="text-lg font-medium py-2 border-b border-zinc-100 dark:border-zinc-800">
              Modèle d'académie
            </Link>
            <Link href="/services" onClick={() => setOpen(false)} className="text-lg font-medium py-2 border-b border-zinc-100 dark:border-zinc-800">
              Services
            </Link>
            <Link href="/cases" onClick={() => setOpen(false)} className="text-lg font-medium py-2 border-b border-zinc-100 dark:border-zinc-800">
              Cas d'utilisation
            </Link>

            {/* Collapsible Partenaires Accordion */}
            <div className="flex flex-col border-b border-zinc-100 dark:border-zinc-800 py-2">
              <button 
                onClick={() => setPartnersOpen(!partnersOpen)} 
                className="flex items-center justify-between text-lg font-medium w-full text-left focus:outline-none"
              >
                <span>Partenaires</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${partnersOpen ? 'rotate-180' : ''}`} />
              </button>
              {partnersOpen && (
                <div className="grid grid-cols-1 gap-3 pl-4 pt-3 pb-1 animate-in fade-in duration-200">
                  {partners.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        {p.logo}
                      </div>
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{p.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link href="/pricing" onClick={() => setOpen(false)} className="text-lg font-medium py-2 border-b border-zinc-100 dark:border-zinc-800">
              Tarifs
            </Link>
            <div className="flex flex-col gap-3 pt-4">
              {session ? (
                <Link 
                  href={getDashboardLink()} 
                  onClick={() => setOpen(false)} 
                  className="text-center py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Accéder au Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="text-center py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    Se connecter
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="text-center py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                    S'inscrire
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
