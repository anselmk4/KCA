"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { getSimulatedSession } from "@/lib/rbac";
import { supabase } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const { t, language } = useLanguage();

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
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Menu"
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {open && (
        <>
          <div 
            className="fixed inset-0 top-16 bg-black/40 backdrop-blur-xs z-45 animate-in fade-in duration-200" 
            onClick={() => setOpen(false)} 
          />
          <div className="absolute top-16 left-0 right-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-xl z-50 animate-in slide-in-from-top-2">
          <nav className="flex flex-col p-6 space-y-4 text-left">
            <Link href="/about" onClick={() => setOpen(false)} className="text-lg font-medium py-2 border-b border-zinc-100 dark:border-zinc-800">
              {t("nav.about")}
            </Link>
            <Link href="/features" onClick={() => setOpen(false)} className="text-lg font-medium py-2 border-b border-zinc-100 dark:border-zinc-800">
              {t("nav.features")}
            </Link>
            <Link href="/templates" onClick={() => setOpen(false)} className="text-lg font-medium py-2 border-b border-zinc-100 dark:border-zinc-800">
              {language === "en" ? "Academy Models" : "Modèle d'académie"}
            </Link>
            <Link href="/services" onClick={() => setOpen(false)} className="text-lg font-medium py-2 border-b border-zinc-100 dark:border-zinc-800">
              Services
            </Link>
            <Link href="/cases" onClick={() => setOpen(false)} className="text-lg font-medium py-2 border-b border-zinc-100 dark:border-zinc-800">
              {language === "en" ? "Use Cases" : "Cas d'utilisation"}
            </Link>
            <Link href="/partners" onClick={() => setOpen(false)} className="text-lg font-medium py-2 border-b border-zinc-100 dark:border-zinc-800">
              {language === "en" ? "Partners" : "Partenaires"}
            </Link>
            <Link href="/pricing" onClick={() => setOpen(false)} className="text-lg font-medium py-2 border-b border-zinc-100 dark:border-zinc-800">
              {t("nav.pricing")}
            </Link>
            <div className="flex flex-col gap-3 pt-4">
              {session ? (
                <Link 
                  href={getDashboardLink()} 
                  onClick={() => setOpen(false)} 
                  className="text-center py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  {t("nav.dashboard")}
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="text-center py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    {t("nav.login")}
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="text-center py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                    {t("nav.register")}
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </>)}
    </div>
  );
}
