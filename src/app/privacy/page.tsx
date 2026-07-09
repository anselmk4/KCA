"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Database, Activity, EyeOff, Lock, UserCheck } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState("section-1");

  const sections = [
    { id: "section-1", title: "1. Données Collectées", icon: Database },
    { id: "section-2", title: "2. Utilisation de vos Données", icon: Activity },
    { id: "section-3", title: "3. Confidentialité et Partage", icon: EyeOff },
    { id: "section-4", title: "4. Sécurité des Informations", icon: Lock },
    { id: "section-5", title: "5. Vos Droits", icon: UserCheck },
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
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-teal-500/5 dark:bg-teal-500/[0.03] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-10 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

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
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-1 text-center md:text-left">
                <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white leading-tight">
                  Politique de Confidentialité
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
                {/* 1. Données Collectées */}
                <section 
                  id="section-1" 
                  className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 scroll-mt-28 transition-all hover:border-teal-500/30"
                >
                  <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <Database className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      1. Données Collectées
                    </h2>
                  </div>
                  <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    <p>
                      Lorsque vous créez un compte apprenant ou formateur sur ANSELLA, nous collectons les informations nécessaires à votre identification et à la fourniture de nos services :
                    </p>
                    <ul className="list-none space-y-2.5 pl-2">
                      <li className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2" />
                        <span>Votre nom complet et adresse e-mail.</span>
                      </li>
                      <li className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2" />
                        <span>Les informations de votre profil public (nationalité, biographie, photo de profil).</span>
                      </li>
                      <li className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2" />
                        <span>Vos coordonnées de facturation pour les encaissements ou les paiements Mobile Money.</span>
                      </li>
                    </ul>
                  </div>
                </section>

                {/* 2. Utilisation de vos Données */}
                <section 
                  id="section-2" 
                  className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 scroll-mt-28 transition-all hover:border-teal-500/30"
                >
                  <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <Activity className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      2. Utilisation de vos Données
                    </h2>
                  </div>
                  <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    <p>
                      Vos informations personnelles nous permettent de personnaliser votre expérience sur la plateforme éducative, notamment pour :
                    </p>
                    <ul className="list-none space-y-2.5 pl-2">
                      <li className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2" />
                        <span>Gérer vos inscriptions à des cours et suivre votre progression.</span>
                      </li>
                      <li className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2" />
                        <span>Valider et exécuter les paiements de cours via M-Pesa, Orange Money, Airtel Money.</span>
                      </li>
                      <li className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2" />
                        <span>Générer et certifier vos diplômes ou certificats de réussite.</span>
                      </li>
                      <li className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2" />
                        <span>Assurer le support client et vous envoyer des notifications de sécurité.</span>
                      </li>
                    </ul>
                  </div>
                </section>

                {/* 3. Confidentialité et Partage */}
                <section 
                  id="section-3" 
                  className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 scroll-mt-28 transition-all hover:border-teal-500/30"
                >
                  <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <EyeOff className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      3. Confidentialité et Partage
                    </h2>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    ANSELLA s'engage à ne jamais revendre vos données personnelles à des fins commerciales. Elles ne sont partagées qu'avec les tiers essentiels à notre bon fonctionnement (services de base de données Supabase, passerelles de paiement électronique pour les transactions Mobile Money).
                  </p>
                </section>

                {/* 4. Sécurité des Informations */}
                <section 
                  id="section-4" 
                  className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 scroll-mt-28 transition-all hover:border-teal-500/30"
                >
                  <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <Lock className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      4. Sécurité des Informations
                    </h2>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    Nous utilisons les standards de l'industrie technologique pour protéger vos informations personnelles. L'authentification de notre plateforme s'appuie sur Supabase Auth, assurant un cryptage renforcé de vos identifiants et données de sessions de connexion.
                  </p>
                </section>

                {/* 5. Vos Droits */}
                <section 
                  id="section-5" 
                  className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 space-y-4 scroll-mt-28 transition-all hover:border-teal-500/30"
                >
                  <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <UserCheck className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      5. Vos Droits
                    </h2>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    Conformément à la réglementation sur la protection des données personnelles, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Vous pouvez effectuer ces modifications depuis votre page de paramètres de profil sur la plateforme ou en contactant notre équipe d'administration.
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
