"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { 
  ChevronDown, 
  Layers, 
  Globe2, 
  GraduationCap, 
  Scale, 
  ShoppingBag, 
  BookOpen, 
  Download, 
  FileText, 
  Heart, 
  Info,
  Sparkles,
  Mail
} from "lucide-react";
import { getSimulatedSession } from "@/lib/rbac";
import { supabase } from "@/lib/supabase/client";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export function Navbar() {
  const { t, language } = useLanguage();
  const isEn = language === "en";

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleLinkClick = () => {
    setOpenDropdown(null);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center shrink-0 mr-4">
          <Image src="/logo.png" alt="ANSELLA Logo" width={140} height={42} className="object-contain h-9 w-auto dark:hidden" priority />
          <Image src="/logo-dark.png" alt="ANSELLA Logo" width={140} height={42} className="object-contain h-9 w-auto hidden dark:block" priority />
        </Link>

        {/* Grouped Desktop Navigation */}
        <nav ref={navRef} className="hidden lg:flex items-center space-x-1 xl:space-x-2 text-sm font-medium">
          
          {/* 1. DROPDOWN PLATEFORME */}
          <div 
            className="relative"
            onMouseEnter={() => setOpenDropdown("platform")}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              onClick={() => setOpenDropdown(openDropdown === "platform" ? null : "platform")}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                openDropdown === "platform"
                  ? "text-teal-600 dark:text-teal-400 bg-zinc-100/80 dark:bg-zinc-800/60 font-semibold"
                  : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/50 dark:hover:bg-zinc-850/50"
              }`}
              aria-expanded={openDropdown === "platform"}
            >
              <span>{isEn ? "Platform" : "Plateforme"}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === "platform" ? "rotate-180" : ""}`} />
            </button>

            {openDropdown === "platform" && (
              <div className="absolute top-full left-0 pt-2 w-80 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2.5 shadow-xl shadow-zinc-950/10 dark:shadow-zinc-950/40 backdrop-blur-xl space-y-1">
                  
                  <Link
                    href="/features"
                    onClick={handleLinkClick}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-zinc-900 dark:text-white">
                        {isEn ? "Features & Tools" : "Fonctionnalités"}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                        {isEn ? "AI pedagogy, exams, homework auto-grader" : "IA pédagogique, examens, devoirs auto-corrigés"}
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/lms-afrique"
                    onClick={handleLinkClick}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <Globe2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-zinc-900 dark:text-white">
                        {isEn ? "LMS Africa" : "LMS Afrique"}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                        {isEn ? "Pan-African hub & native Mobile Money" : "Hub panafricain & Mobile Money natif"}
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/templates"
                    onClick={handleLinkClick}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-zinc-900 dark:text-white">
                        {isEn ? "Academy Models" : "Modèles d'Académie"}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                        {isEn ? "Active pedagogy and virtual academies" : "Pédagogie active & académies certifiantes"}
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/vs"
                    onClick={handleLinkClick}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-zinc-900 dark:text-white">
                        {isEn ? "LMS Comparisons" : "Comparatifs LMS"}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                        {isEn ? "ANSELLA vs Teachable, Udemy & Kajabi" : "ANSELLA face à Teachable, Udemy, Kajabi"}
                      </p>
                    </div>
                  </Link>

                </div>
              </div>
            )}
          </div>

          {/* 2. DROPDOWN BOUTIQUE & FORMATIONS */}
          <div 
            className="relative"
            onMouseEnter={() => setOpenDropdown("store")}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              onClick={() => setOpenDropdown(openDropdown === "store" ? null : "store")}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                openDropdown === "store"
                  ? "text-teal-600 dark:text-teal-400 bg-zinc-100/80 dark:bg-zinc-800/60 font-semibold"
                  : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/50 dark:hover:bg-zinc-850/50"
              }`}
              aria-expanded={openDropdown === "store"}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              <span>{isEn ? "Store & Courses" : "Boutique & Cours"}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === "store" ? "rotate-180" : ""}`} />
            </button>

            {openDropdown === "store" && (
              <div className="absolute top-full left-0 pt-2 w-80 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2.5 shadow-xl shadow-zinc-950/10 dark:shadow-zinc-950/40 backdrop-blur-xl space-y-1">
                  
                  <Link
                    href="/store"
                    onClick={handleLinkClick}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-zinc-900 dark:text-white">
                          {isEn ? "Digital Store" : "Boutique Digitale"}
                        </span>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400">
                          {isEn ? "New" : "Nouveau"}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                        {isEn ? "E-books, ZIP software, Notion templates & AI packs" : "E-books, logiciels ZIP, templates & prompts IA"}
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/courses"
                    onClick={handleLinkClick}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-zinc-900 dark:text-white">
                        {isEn ? "Course Catalog" : "Catalogue de Formations"}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                        {isEn ? "Certified learning paths in Web3, AI & code" : "Formations certifiantes en Web3, IA et code"}
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/store/access"
                    onClick={handleLinkClick}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-zinc-900 dark:text-white">
                        {isEn ? "My Downloads" : "Mes Téléchargements"}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                        {isEn ? "Instant access to your purchased digital goods" : "Retrouvez vos e-books et fichiers achetés"}
                      </p>
                    </div>
                  </Link>

                </div>
              </div>
            )}
          </div>

          {/* 3. DROPDOWN RESSOURCES */}
          <div 
            className="relative"
            onMouseEnter={() => setOpenDropdown("resources")}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              onClick={() => setOpenDropdown(openDropdown === "resources" ? null : "resources")}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                openDropdown === "resources"
                  ? "text-teal-600 dark:text-teal-400 bg-zinc-100/80 dark:bg-zinc-800/60 font-semibold"
                  : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/50 dark:hover:bg-zinc-850/50"
              }`}
              aria-expanded={openDropdown === "resources"}
            >
              <span>{isEn ? "Resources" : "Ressources"}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === "resources" ? "rotate-180" : ""}`} />
            </button>

            {openDropdown === "resources" && (
              <div className="absolute top-full left-0 pt-2 w-80 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2.5 shadow-xl shadow-zinc-950/10 dark:shadow-zinc-950/40 backdrop-blur-xl space-y-1">
                  
                  <Link
                    href="/docs"
                    onClick={handleLinkClick}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-zinc-900 dark:text-white">
                        {isEn ? "Documentation" : "Documentation Formateurs"}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                        {isEn ? "Step-by-step guides, payouts & settings" : "Guides pas à pas, retraits et configuration"}
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/blog"
                    onClick={handleLinkClick}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-zinc-900 dark:text-white">
                        Blog & Guides
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                        {isEn ? "EdTech insights, sales strategies & tutorials" : "Stratégies de monétisation et tutoriels"}
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/about"
                    onClick={handleLinkClick}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Info className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-zinc-900 dark:text-white">
                        {isEn ? "About ANSELLA" : "À propos d'ANSELLA"}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                        {isEn ? "Our mission, leadership & vision" : "Notre mission, équipe et vision internationale"}
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/donate"
                    onClick={handleLinkClick}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 shrink-0 mt-0.5 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                      <Heart className="w-4 h-4 fill-rose-500/30 group-hover:fill-white" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <span>{isEn ? "Scholarships / Donate" : "Faire un Don / Bourses"}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                        {isEn ? "Fund tech scholarships for youth" : "Financer des bourses pour les jeunes talents"}
                      </p>
                    </div>
                  </Link>

                </div>
              </div>
            )}
          </div>

          {/* 4. LIEN DIRECT TARIFS */}
          <Link 
            href="/pricing" 
            className="px-3 py-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/50 dark:hover:bg-zinc-850/50 transition-colors font-medium"
          >
            {t("nav.pricing")}
          </Link>

          {/* 5. LIEN DIRECT CONTACT */}
          <Link 
            href="/contact" 
            className="px-3 py-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-zinc-100/50 dark:hover:bg-zinc-850/50 transition-colors font-medium flex items-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Contact</span>
          </Link>

        </nav>

        {/* Right Action Icons & Auth */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <LanguageSwitcher />
          <ThemeToggle />
          
          {loading ? (
            <div className="h-9 w-24 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl hidden sm:block" />
          ) : session ? (
            <Link 
              href={getDashboardLink()} 
              className="hidden sm:inline-flex items-center justify-center rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white h-9 px-4 transition-colors shadow-xs"
            >
              {t("nav.dashboard")}
            </Link>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center rounded-xl text-xs sm:text-sm font-semibold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 h-9 px-3.5 transition-colors"
              >
                {t("nav.login")}
              </Link>
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white h-9 px-3.5 transition-colors shadow-xs"
              >
                {t("nav.register")}
              </Link>
            </div>
          )}
          
          {/* Mobile drawer toggle */}
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
