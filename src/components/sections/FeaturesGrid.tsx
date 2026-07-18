"use client";

import { Zap, Shield, Smartphone, Globe, ArrowRight, Play, CheckCircle2 } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export function FeaturesGrid() {
  const { language } = useLanguage();
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };


  return (
    <section id="features" className="py-32 bg-transparent text-zinc-900 dark:text-white relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-teal-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 relative z-10 max-w-6xl">
        
        {/* Title / Subtitle section with reveal animation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20 space-y-4"
        >
          <span className="text-xs font-bold text-teal-400 bg-teal-400/10 border border-teal-500/20 px-3.5 py-1 rounded-full uppercase tracking-widest">
            {language === "en" ? "Creator Tools" : "Outils Créateurs"}
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
            {language === "en" ? "A world-class " : "Une plateforme d'enseignement de "}
            <span className="bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
              {language === "en" ? "teaching platform" : "classe mondiale"}
            </span>
          </h2>
          <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {language === "en" 
              ? "ANSELLA provides all the necessary tools to create, manage, and monetize your educational content."
              : "ANSELLA vous fournit tous les outils nécessaires pour créer, gérer et rentabiliser votre contenu éducatif."}
          </p>
        </motion.div>
        
        {/* Bento Grid layout */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          
          {/* Box 1: Paiements Mobiles (Featured big card spanning 2 columns) */}
          <motion.div 
            variants={itemVariants}
            className="md:col-span-2 group relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/40 p-8 flex flex-col justify-between hover:border-zinc-350 dark:hover:border-zinc-700/80 transition-all duration-300"
          >
            {/* Hover glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="space-y-4 relative z-10">
              <div className="bg-teal-500/15 w-12 h-12 rounded-2xl flex items-center justify-center text-teal-400 border border-teal-500/20">
                <Smartphone className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                {language === "en" ? "Flexible Payments & Payouts" : "Paiements et Retraits Flexibles"}
              </h3>
              <p className="text-sm text-zinc-650 dark:text-zinc-400 max-w-md leading-relaxed">
                {language === "en" 
                  ? "Collect online registrations and withdraw your earnings via bank cards, PayPal, or Mobile Money in a simple and secure way."
                  : "Encaissez les inscriptions en ligne et retirez vos gains par cartes bancaires, PayPal ou Mobile Money de manière simple et sécurisée."}
              </p>
            </div>

            {/* Visual simulation inside the bento item */}
            <div className="mt-8 relative h-36 bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4 overflow-hidden flex items-center justify-between gap-4">
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-500 font-bold uppercase">
                  {language === "en" ? "Transaction verified" : "Transaction validée"}
                </p>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-sm font-bold">$150.00 USD</p>
                </div>
                <p className="text-[10px] text-zinc-600 dark:text-zinc-450">
                  {language === "en" ? "Via Mobile Money • Kinshasa, CD" : "Via Stripe • Paris, FR"}
                </p>
              </div>
              
              <div className="flex flex-col gap-1.5 shrink-0 bg-white dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800/80 p-3 rounded-xl">
                <span className="text-[9px] text-zinc-550 dark:text-zinc-500 font-bold">
                  {language === "en" ? "AVAILABLE BALANCE" : "SOLDE DISPONIBLE"}
                </span>
                <span className="text-lg font-black text-teal-400">$2,480.00</span>
              </div>
            </div>
          </motion.div>
          
          {/* Box 2: Quiz & Évaluations */}
          <motion.div 
            variants={itemVariants}
            className="group relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/40 p-8 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="space-y-4 relative z-10">
              <div className="bg-indigo-500/15 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                {language === "en" ? "Quizzes & Assessments" : "Quiz & Évaluations"}
              </h3>
              <p className="text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed">
                {language === "en" 
                  ? "Create interactive MCQs to test your learners' knowledge with automatic grading and automated certificate issuance."
                  : "Créez des QCM interactifs pour tester les connaissances de vos apprenants avec correction automatique et obtention automatique du certificat."}
              </p>
            </div>

            {/* Interactive checkmark UI simulation */}
            <div className="mt-8 flex gap-2 items-center bg-zinc-100/50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900/50 p-3.5 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-[11px] font-bold text-zinc-750 dark:text-zinc-300">
                {language === "en" ? "Certificate unlocked at score ≥ 80%" : "Certificat débloqué au score ≥ 80%"}
              </span>
            </div>
          </motion.div>

          {/* Box 3: Générateur de cours */}
          <motion.div 
            variants={itemVariants}
            className="group relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/40 p-8 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="space-y-4 relative z-10">
              <div className="bg-emerald-500/15 w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                {language === "en" ? "Course Builder" : "Générateur de Cours"}
              </h3>
              <p className="text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed">
                {language === "en" 
                  ? "Structure your courses into modules and lessons, add videos and resources quickly and easily."
                  : "Structurez vos cours en modules et leçons, ajoutez des vidéos et des ressources de manière simple et rapide."}
              </p>
            </div>

            <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-teal-400 group-hover:translate-x-1 transition-transform">
              {language === "en" ? "Try the builder" : "Essayer le builder"} <ArrowRight className="w-4 h-4" />
            </div>
          </motion.div>

          {/* Box 4: Analyses et Suivi Élèves (Spans 2 columns) */}
          <motion.div 
            variants={itemVariants}
            className="md:col-span-2 group relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/40 p-8 flex flex-col justify-between hover:border-zinc-350 dark:hover:border-zinc-700/80 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="space-y-4 relative z-10">
              <div className="bg-indigo-500/15 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                {language === "en" ? "Analytics & Student Tracking" : "Analyses & Suivi Élèves"}
              </h3>
              <p className="text-sm text-zinc-650 dark:text-zinc-400 max-w-md leading-relaxed">
                {language === "en" 
                  ? "Track your learners' average progress, course completion rates, and your revenue statistics using our analytics dashboard."
                  : "Suivez la progression moyenne de vos apprenants, les taux de complétion des cours et vos statistiques de revenus grâce à notre tableau analytique."}
              </p>
            </div>

            {/* Visual simulation of progress graph */}
            <div className="mt-8 grid grid-cols-4 gap-2 items-end h-20 pt-4 px-4 bg-zinc-100/30 dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-900 rounded-xl">
              <div className="bg-zinc-300 dark:bg-zinc-800 h-[30%] rounded-t-md" />
              <div className="bg-zinc-300 dark:bg-zinc-800 h-[55%] rounded-t-md" />
              <div className="bg-indigo-500 h-[80%] rounded-t-md group-hover:h-[90%] transition-all duration-500" />
              <div className="bg-teal-400 h-[45%] rounded-t-md group-hover:h-[65%] transition-all duration-500" />
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
