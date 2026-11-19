"use client";

import Link from "next/link";
import { 
  Zap, Shield, Smartphone, Globe, ArrowRight, CheckCircle2, 
  Layers, Lock, Sparkles, FileCheck
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/context/LanguageContext";

export default function FeaturesPage() {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="flex min-h-screen flex-col font-sans bg-gradient-to-br from-slate-100 via-teal-50/50 to-blue-50/70 dark:from-zinc-900 dark:via-zinc-950 dark:to-black text-zinc-900 dark:text-white selection:bg-teal-500/30">
      <Navbar />
      
      <main className="flex-1 py-20">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8 max-w-6xl space-y-24 relative z-10">
          
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <span className="text-xs font-bold text-teal-400 bg-teal-400/10 border border-teal-500/20 px-3.5 py-1 rounded-full uppercase tracking-widest">
              {isEn ? "Features" : "Fonctionnalités"}
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-zinc-900 dark:text-white">
              {isEn ? "A world-class " : "Une plateforme d'enseignement "}
              <span className="bg-gradient-to-r from-teal-500 via-teal-450 to-indigo-500 dark:from-teal-400 dark:to-indigo-400 bg-clip-text text-transparent">
                {isEn ? "educational platform." : "de classe mondiale."}
              </span>
            </h1>
            <p className="text-lg text-zinc-650 dark:text-zinc-400 leading-relaxed">
              {isEn 
                ? "Explore all the premium tools developed specifically to design, structure, deliver, and monetize your courses worldwide."
                : "Explorez tous les outils professionnels conçus spécialement pour concevoir, structurer, diffuser et rentabiliser vos formations dans le monde entier."}
            </p>
          </div>

          {/* Grid of Main Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
            
            {/* Feature 1: Flexible & Global Payments */}
            <div className="bg-white/40 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-8 space-y-6 hover:border-zinc-350 dark:hover:border-zinc-700/80 transition-all group relative overflow-hidden text-left">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="bg-teal-500/15 w-12 h-12 rounded-2xl flex items-center justify-center text-teal-500 dark:text-teal-400 border border-teal-500/20 shrink-0">
                <Smartphone className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {isEn ? "Flexible & Global Payments" : "Paiements Flexibles & Globaux"}
                </h3>
                <p className="text-zinc-650 dark:text-zinc-400 text-sm leading-relaxed">
                  {isEn
                    ? "Collect enrollments directly via bank cards, PayPal, and global and local Mobile Money networks. Withdraw your instructor earnings instantly in a simple and secure manner, without complicated intermediaries."
                    : "Encaissez les inscriptions directement par cartes bancaires, PayPal et les réseaux Mobile Money locaux et panafricains. Retirez vos gains de formateur instantanément de manière simple et sécurisée, sans intermédiaires complexes."}
                </p>
              </div>
              <ul className="space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" />
                  <span>{isEn ? "Instant simulation in sandbox mode" : "Simulation instantanée en mode test"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" />
                  <span>{isEn ? "Automatic order reconciliation" : "Rapprochement automatique des commandes"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" />
                  <span>{isEn ? "Detailed history and statistics" : "Historique et statistiques financières détaillées"}</span>
                </li>
              </ul>
            </div>

            {/* Feature 2: Secure Video & Resources */}
            <div className="bg-white/40 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-8 space-y-6 hover:border-zinc-350 dark:hover:border-zinc-700/80 transition-all group relative overflow-hidden text-left">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="bg-blue-500/15 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-500 dark:text-blue-400 border border-blue-500/20 shrink-0">
                <Lock className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {isEn ? "Video Hosting & Security" : "Hébergement Vidéo & Sécurité"}
                </h3>
                <p className="text-zinc-650 dark:text-zinc-400 text-sm leading-relaxed">
                  {isEn
                    ? "Protecting your intellectual property is our absolute priority. Integrate your lesson videos smoothly and securely through our proprietary player that blocks unauthorized direct downloads."
                    : "La protection de votre propriété intellectuelle est notre priorité absolue. Intégrez vos vidéos de cours de manière fluide et sécurisée grâce à notre lecteur propriétaire qui bloque le téléchargement direct non autorisé."}
                </p>
              </div>
              <ul className="space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" />
                  <span>{isEn ? "Anti-download protection" : "Protection anti-téléchargement"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" />
                  <span>{isEn ? "YouTube, Vimeo & Direct Video integration" : "Intégration YouTube, Vimeo et vidéo directe"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" />
                  <span>{isEn ? "Player optimized for low internet connections" : "Lecteur optimisé pour les connexions à faible débit"}</span>
                </li>
              </ul>
            </div>

            {/* Feature 3: Modular Course Builder */}
            <div className="bg-white/40 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-8 space-y-6 hover:border-zinc-350 dark:hover:border-zinc-700/80 transition-all group relative overflow-hidden text-left">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="bg-indigo-500/15 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                <Layers className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {isEn ? "Modular Course Builder" : "Constructeur de Cours Modulaire"}
                </h3>
                <p className="text-zinc-650 dark:text-zinc-400 text-sm leading-relaxed">
                  {isEn
                    ? "Structure your training didactically and professionally. Divide your content into clear modules and chapters, add assessment quizzes, and provide downloadable course materials (PDF, ZIP)."
                    : "Structurez vos formations de manière didactique et professionnelle. Découpez vos cours en modules et chapitres clairs, ajoutez des quiz d'évaluation et fournissez des supports téléchargeables (PDF, ZIP)."}
                </p>
              </div>
              <ul className="space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" />
                  <span>{isEn ? "Unlimited sections and chapters" : "Sections et chapitres illimités"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" />
                  <span>{isEn ? "File manager for external resources" : "Gestionnaire de fichiers et ressources téléchargeables"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" />
                  <span>{isEn ? "Draft mode to prepare your publications" : "Mode brouillon pour peaufiner avant publication"}</span>
                </li>
              </ul>
            </div>

            {/* Feature 4: Interactive Quizzes & Certificates */}
            <div className="bg-white/40 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-8 space-y-6 hover:border-zinc-350 dark:hover:border-zinc-700/80 transition-all group relative overflow-hidden text-left">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="bg-purple-500/15 w-12 h-12 rounded-2xl flex items-center justify-center text-purple-500 dark:text-purple-400 border border-purple-500/20 shrink-0">
                <FileCheck className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {isEn ? "Interactive Quizzes & Certifications" : "Quiz Interactifs & Certifications"}
                </h3>
                <p className="text-zinc-650 dark:text-zinc-400 text-sm leading-relaxed">
                  {isEn
                    ? "Validate the skills acquired by your learners. Create multiple-choice questionnaires (MCQ) with automatic grade calculation and instantly generate personalized, online-verifiable completion certificates with a unique code."
                    : "Validez les compétences acquises par vos apprenants. Créez des questionnaires à choix multiples (QCM) avec calcul automatique des notes et générez instantanément des certificats de complétion personnalisés vérifiables en ligne avec un code unique."}
                </p>
              </div>
              <ul className="space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" />
                  <span>{isEn ? "Complete question editor" : "Éditeur complet de questions et barèmes"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" />
                  <span>{isEn ? "Customizable passing thresholds" : "Seuils de réussite personnalisables"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 dark:text-teal-400 shrink-0" />
                  <span>{isEn ? "Public verification code for employers" : "Code de vérification public pour les employeurs"}</span>
                </li>
              </ul>
            </div>
            
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-teal-900 to-indigo-950 dark:from-zinc-950 dark:to-zinc-900 border border-teal-850 dark:border-zinc-800 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden text-white shadow-2xl">
            <div className="space-y-4 max-w-2xl relative z-10 text-left">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> {isEn ? "Ready to get started?" : "Prêt à commencer ?"}
              </div>
              <h2 className="text-2xl md:text-3xl font-black">
                {isEn ? "Join Ansella today" : "Rejoignez Ansella aujourd'hui"}
              </h2>
              <p className="text-zinc-300 text-sm leading-relaxed">
                {isEn
                  ? "Create your personalized academy in a few clicks and start delivering your training right now."
                  : "Créez votre académie personnalisée en quelques clics et commencez à dispenser vos formations dès maintenant."}
              </p>
            </div>
            <div className="shrink-0 relative z-10 w-full md:w-auto">
              <Link 
                href="/register" 
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold text-sm transition-all shadow-lg shadow-teal-500/10"
              >
                {isEn ? "Get started for free" : "Commencer gratuitement"} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
