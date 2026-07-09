"use client";

import { useState } from "react";
import Link from "next/link";
import { Scale, ArrowLeft, Shield, FileText, UserCheck, AlertTriangle, KeyRound, HelpCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState("section-1");

  const sections = [
    { id: "section-1", title: "1. Acceptation des Conditions", icon: UserCheck },
    { id: "section-2", title: "2. Rôle d'ANSELLA", icon: Shield },
    { id: "section-3", title: "3. Responsabilités du Formateur", icon: FileText },
    { id: "section-4", title: "4. Paiements et Retraits via Mobile Money", icon: KeyRound },
    { id: "section-5", title: "5. Sécurité et Hébergement", icon: AlertTriangle },
    { id: "section-6", title: "6. Résiliation", icon: HelpCircle },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col font-sans bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-teal-500/30 transition-colors duration-300">
      <Navbar />

      <main className="flex-1 py-28 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-teal-500/5 dark:bg-teal-500/[0.03] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8 max-w-6xl space-y-12 relative z-10">
          
          {/* Header */}
          <div className="space-y-4 text-center md:text-left">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
            </Link>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <div className="p-3.5 bg-teal-500/10 dark:bg-teal-500/5 border border-teal-500/20 text-teal-600 dark:text-teal-400 rounded-2xl">
                <Scale className="w-8 h-8" />
              </div>
              <div className="space-y-1 text-center md:text-left">
                <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white leading-tight">
                  Conditions Générales d'Utilisation
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Dernière mise à jour : 30 Juin 2026 • Plateforme ANSELLA
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Sidebar Table of Contents (Left) */}
            <aside className="lg:col-span-4 sticky top-28 hidden lg:block space-y-4">
              <div className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm">
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase tracking-wider mb-4">
                  Sommaire
                </h3>
                <nav className="space-y-2">
                  {sections.map((sec) => {
                    const Icon = sec.icon;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => scrollToSection(sec.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all duration-200 cursor-pointer ${
                          activeSection === sec.id
                            ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-l-4 border-teal-500"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{sec.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Detailed Content (Right) */}
            <div className="lg:col-span-8 space-y-6">
              
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* 1. Acceptation des Conditions */}
                <section 
                  id="section-1" 
                  className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 scroll-mt-28 transition-all hover:border-teal-500/30"
                >
                  <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <UserCheck className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      1. Acceptation des Conditions
                    </h2>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    En accédant et en utilisant la plateforme éducative ANSELLA, vous acceptez d'être lié par les présentes conditions générales d'utilisation, toutes les lois et réglementations applicables à l'échelle internationale et locale. Si vous n'avez pas accepté ces conditions, vous ne devez pas utiliser le service.
                  </p>
                </section>

                {/* 2. Rôle d'ANSELLA */}
                <section 
                  id="section-2" 
                  className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 scroll-mt-28 transition-all hover:border-teal-500/30"
                >
                  <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <Shield className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      2. Rôle d'ANSELLA
                    </h2>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    ANSELLA agit en tant que fournisseur de technologie de gestion de l'apprentissage (SaaS LMS) et intermédiaire de paiement électronique. Nous permettons aux créateurs indépendants (les Formateurs) de créer des académies de formation privées, et aux étudiants (les Apprenants) de s'inscrire et d'accéder aux cours.
                  </p>
                </section>

                {/* 3. Responsabilités du Formateur */}
                <section 
                  id="section-3" 
                  className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 scroll-mt-28 transition-all hover:border-teal-500/30"
                >
                  <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <FileText className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      3. Responsabilités du Formateur
                    </h2>
                  </div>
                  <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    <p>
                      Le formateur est l'unique propriétaire intellectuel et légal du contenu qu'il publie (cours, vidéos, textes, supports). Il s'engage à :
                    </p>
                    <ul className="list-none space-y-2.5 pl-2">
                      <li className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2" />
                        <span>Ne pas violer les droits de propriété intellectuelle de tiers.</span>
                      </li>
                      <li className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2" />
                        <span>Ne pas diffuser de contenu haineux, frauduleux, pornographique ou diffamatoire.</span>
                      </li>
                      <li className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2" />
                        <span>Fournir un support adéquat aux apprenants selon la formule choisie.</span>
                      </li>
                    </ul>
                  </div>
                </section>

                {/* 4. Paiements et Retraits */}
                <section 
                  id="section-4" 
                  className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 scroll-mt-28 transition-all hover:border-teal-500/30"
                >
                  <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <KeyRound className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      4. Paiements et Retraits via Mobile Money
                    </h2>
                  </div>
                  <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    <p>
                      La plateforme intègre des méthodes de paiement locales incluant M-Pesa, Orange Money, et Airtel Money.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <h4 className="font-extrabold text-xs text-zinc-800 dark:text-white uppercase mb-1">Pour les Apprenants</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Tout achat de formation est définitif après validation de la transaction Mobile Money ou bancaire.
                        </p>
                      </div>
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <h4 className="font-extrabold text-xs text-zinc-800 dark:text-white uppercase mb-1">Pour les Formateurs</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Les retraits s'effectuent après déduction des frais de service correspondant au plan de facturation actif.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 5. Sécurité et Hébergement */}
                <section 
                  id="section-5" 
                  className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 scroll-mt-28 transition-all hover:border-teal-500/30"
                >
                  <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <AlertTriangle className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      5. Sécurité et Hébergement
                    </h2>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    ANSELLA déploie des systèmes de cryptage et des lecteurs vidéo sécurisés pour limiter au maximum le téléchargement illégal de vos cours. Cependant, le formateur comprend que le risque zéro sur Internet n'existe pas et décharge ANSELLA de toute responsabilité en cas de piratage externe échappant à notre contrôle standard.
                  </p>
                </section>

                {/* 6. Résiliation */}
                <section 
                  id="section-6" 
                  className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 scroll-mt-28 transition-all hover:border-teal-500/30"
                >
                  <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <HelpCircle className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      6. Résiliation
                    </h2>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    Nous nous réservons le droit de suspendre ou de fermer définitivement le compte de tout formateur ou apprenant en cas de non-respect flagrant des présentes conditions, de tentative de fraude de paiement, ou de signalement répété de contenu illicite.
                  </p>
                </section>

              </motion.div>

            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
