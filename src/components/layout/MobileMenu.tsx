"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Menu, 
  X, 
  ChevronDown, 
  Layers, 
  Globe2, 
  GraduationCap, 
  Scale, 
  ShoppingBag, 
  BookOpen, 
  Download, 
  FileText, 
  Sparkles, 
  Info, 
  Heart, 
  Mail,
  CreditCard
} from "lucide-react";
import { getSimulatedSession } from "@/lib/rbac";
import { supabase } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("platform");
  const { t, language } = useLanguage();
  const isEn = language === "en";

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

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors"
        aria-label="Menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <>
          <div 
            className="fixed inset-0 top-16 bg-black/50 backdrop-blur-xs z-40 animate-in fade-in duration-200" 
            onClick={() => setOpen(false)} 
          />
          <div className="absolute top-16 left-0 right-0 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-850 shadow-2xl z-50 animate-in slide-in-from-top-2 max-h-[calc(100vh-64px)] overflow-y-auto">
            <nav className="p-5 space-y-3 text-left">
              
              {/* GROUPE 1: PLATEFORME */}
              <div className="border border-zinc-200 dark:border-zinc-850 rounded-2xl overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/40">
                <button
                  onClick={() => toggleSection("platform")}
                  className="w-full flex items-center justify-between p-3.5 font-bold text-sm text-zinc-900 dark:text-white"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-500" />
                    <span>{isEn ? "Platform & Solutions" : "Plateforme & Outils"}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${expandedSection === "platform" ? "rotate-180" : ""}`} />
                </button>

                {expandedSection === "platform" && (
                  <div className="p-2 pt-0 space-y-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
                    <Link
                      href="/features"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Layers className="w-3.5 h-3.5 text-teal-500" />
                      <span>{isEn ? "Features & Tools" : "Fonctionnalités & Outils"}</span>
                    </Link>
                    <Link
                      href="/lms-afrique"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Globe2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{isEn ? "LMS Africa & Mobile Money" : "LMS Afrique & Mobile Money"}</span>
                    </Link>
                    <Link
                      href="/templates"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{isEn ? "Academy Models" : "Modèles d'Académie"}</span>
                    </Link>
                    <Link
                      href="/vs"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Scale className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isEn ? "LMS Comparisons" : "Comparatifs LMS"}</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* GROUPE 2: BOUTIQUE & FORMATIONS */}
              <div className="border border-zinc-200 dark:border-zinc-850 rounded-2xl overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/40">
                <button
                  onClick={() => toggleSection("store")}
                  className="w-full flex items-center justify-between p-3.5 font-bold text-sm text-zinc-900 dark:text-white"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-teal-500" />
                    <span>{isEn ? "Store & Courses" : "Boutique & Cours"}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${expandedSection === "store" ? "rotate-180" : ""}`} />
                </button>

                {expandedSection === "store" && (
                  <div className="p-2 pt-0 space-y-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
                    <Link
                      href="/store"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <span className="flex items-center gap-2.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-teal-500" />
                        <span>{isEn ? "Digital Store" : "Boutique Digitale"}</span>
                      </span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400">
                        {isEn ? "New" : "Nouveau"}
                      </span>
                    </Link>
                    <Link
                      href="/courses"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                      <span>{isEn ? "Course Catalog" : "Catalogue de Formations"}</span>
                    </Link>
                    <Link
                      href="/store/access"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{isEn ? "My Downloads" : "Mes Téléchargements"}</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* GROUPE 3: RESSOURCES */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/40">
                <button
                  onClick={() => toggleSection("resources")}
                  className="w-full flex items-center justify-between p-3.5 font-bold text-sm text-zinc-900 dark:text-white"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-500" />
                    <span>{isEn ? "Resources" : "Ressources"}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${expandedSection === "resources" ? "rotate-180" : ""}`} />
                </button>

                {expandedSection === "resources" && (
                  <div className="p-2 pt-0 space-y-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
                    <Link
                      href="/docs"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <FileText className="w-3.5 h-3.5 text-teal-500" />
                      <span>{isEn ? "Documentation" : "Documentation Formateurs"}</span>
                    </Link>
                    <Link
                      href="/blog"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      <span>Blog & Guides</span>
                    </Link>
                    <Link
                      href="/about"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Info className="w-3.5 h-3.5 text-blue-500" />
                      <span>{isEn ? "About ANSELLA" : "À propos d'ANSELLA"}</span>
                    </Link>
                    <Link
                      href="/donate"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Heart className="w-3.5 h-3.5 fill-rose-500/30" />
                      <span>{isEn ? "Scholarships / Donate" : "Faire un don / Bourses"}</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* LIENS DIRECTS: TARIFS & CONTACT */}
              <div className="pt-2 space-y-1 border-t border-zinc-200 dark:border-zinc-850">
                <Link
                  href="/pricing"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl font-bold text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-850"
                >
                  <span className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-teal-600" />
                    <span>{t("nav.pricing")}</span>
                  </span>
                </Link>

                <Link
                  href="/contact"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl font-bold text-sm text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                >
                  <span className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4" />
                    <span>Contact & Support</span>
                  </span>
                </Link>
              </div>

              {/* AUTH ACTIONS */}
              <div className="flex flex-col gap-2.5 pt-4">
                {session ? (
                  <Link 
                    href={getDashboardLink()} 
                    onClick={() => setOpen(false)} 
                    className="text-center py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-500 transition-colors shadow-xs"
                  >
                    {t("nav.dashboard")}
                  </Link>
                ) : (
                  <>
                    <Link 
                      href="/login" 
                      onClick={() => setOpen(false)} 
                      className="text-center py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl font-semibold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                    >
                      {t("nav.login")}
                    </Link>
                    <Link 
                      href="/register" 
                      onClick={() => setOpen(false)} 
                      className="text-center py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-500 transition-colors shadow-xs"
                    >
                      {t("nav.register")}
                    </Link>
                  </>
                )}
              </div>

            </nav>
          </div>
        </>
      )}
    </div>
  );
}
