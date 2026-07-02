"use client";

import Link from "next/link";
import { 
  Zap, Shield, Smartphone, Globe, ArrowRight, Play, CheckCircle2, 
  GraduationCap, FileCheck, Layers, Users2, Lock, Sparkles 
} from "lucide-react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col font-sans bg-gradient-to-br from-slate-100 via-teal-50/50 to-blue-50/70 dark:from-zinc-900 dark:via-zinc-950 dark:to-black text-zinc-900 dark:text-white selection:bg-teal-500/30">
      <Navbar />
      
      <main className="flex-1 py-20">
        {/* Background Decorative Gradients & Glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8 max-w-6xl space-y-24 relative z-10">
          
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <span className="text-xs font-bold text-teal-400 bg-teal-400/10 border border-teal-500/20 px-3.5 py-1 rounded-full uppercase tracking-widest">
              Fonctionnalités
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-white">
              Une plateforme éducative de{" "}
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">
                classe mondiale.
              </span>
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed">
              Explorez tous les outils haut de gamme développés spécifiquement pour concevoir, structurer, dispenser et rentabiliser vos cours en Afrique.
            </p>
          </div>

          {/* Grid of Main Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
            
            {/* Feature 1: Mobile Money Integration */}
            <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-3xl p-8 space-y-6 hover:border-zinc-700/80 transition-all group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="bg-teal-500/15 w-12 h-12 rounded-2xl flex items-center justify-center text-teal-400 border border-teal-500/20 shrink-0">
                <Smartphone className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">Paiements Locaux & Mobile Money</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Encaissez directement les inscriptions via les réseaux Mobile Money les plus populaires (M-Pesa, Orange Money, Airtel Money). Retirez instantanément vos revenus d'instructeur sur votre propre compte mobile sans cartes bancaires ni intermédiaires compliqués.
                </p>
              </div>
              <ul className="space-y-2.5 text-sm text-zinc-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" /> Simulation instantanée en mode sandbox</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" /> Rapprochement automatique des commandes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" /> Historique et statistiques détaillés</li>
              </ul>
            </div>

            {/* Feature 2: Secure Video & Resources */}
            <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-3xl p-8 space-y-6 hover:border-zinc-700/80 transition-all group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="bg-blue-500/15 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20 shrink-0">
                <Lock className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">Hébergement Vidéo & Sécurité</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Protéger votre propriété intellectuelle est notre priorité absolue. Intégrez vos vidéos de leçons de manière fluide et sécurisée via notre lecteur propriétaire bloquant le téléchargement direct non autorisé.
                </p>
              </div>
              <ul className="space-y-2.5 text-sm text-zinc-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" /> Protection anti-téléchargement</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" /> Intégration YouTube, Vimeo et Direct Video</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" /> Lecteur optimisé pour faibles connexions internet</li>
              </ul>
            </div>

            {/* Feature 3: Live Course Builder */}
            <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-3xl p-8 space-y-6 hover:border-zinc-700/80 transition-all group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="bg-indigo-500/15 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0">
                <Layers className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">Générateur de Cours Modulaire</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Structurez vos formations de manière didactique et professionnelle. Divisez votre contenu en modules et chapitres clairs, ajoutez des quiz d'évaluation, et fournissez des supports de cours téléchargeables (PDF, ZIP).
                </p>
              </div>
              <ul className="space-y-2.5 text-sm text-zinc-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" /> Ajout illimité de sections et chapitres</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" /> Gestionnaire de fichiers pour ressources externes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" /> Mode brouillon pour préparer vos publications</li>
              </ul>
            </div>

            {/* Feature 4: Interactive Quizzes & Certificates */}
            <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-3xl p-8 space-y-6 hover:border-zinc-700/80 transition-all group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="bg-purple-500/15 w-12 h-12 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20 shrink-0">
                <FileCheck className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">Quiz interactifs & Certifications</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Validez les compétences acquises par vos apprenants. Créez des questionnaires à choix multiples (QCM) avec calcul automatique des notes et générez instantanément des certificats de réussite personnalisés et vérifiables en ligne par code unique.
                </p>
              </div>
              <ul className="space-y-2.5 text-sm text-zinc-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" /> Éditeur de questions complet</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" /> Seuils de réussite personnalisables</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" /> Code de vérification public pour les employeurs</li>
              </ul>
            </div>
            
          </div>

          {/* Value Proposition Call to Action */}
          <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-800 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
            <div className="space-y-4 max-w-2xl relative z-10 text-left">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Prêt à vous lancer ?
              </div>
              <h2 className="text-2xl md:text-3xl font-black">Rejoignez Ansella aujourd&apos;hui</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Créez votre académie personnalisée en quelques clics et commencez à dispenser vos formations dès maintenant.
              </p>
            </div>
            <div className="shrink-0 relative z-10 w-full md:w-auto">
              <Link 
                href="/register" 
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold text-sm transition-all shadow-lg shadow-teal-500/10"
              >
                Commencer gratuitement <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
