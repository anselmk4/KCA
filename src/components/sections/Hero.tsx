"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, GraduationCap, ShieldCheck, DollarSign, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export function Hero() {
  const { t } = useLanguage();
  return (
    <section className="relative overflow-hidden bg-transparent text-zinc-900 dark:text-white pt-28 pb-32 lg:pt-36 lg:pb-44">
      {/* Background Decorative Gradients & Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Grid Pattern overlay for tech feel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-20" />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 text-left space-y-8">
            
            {/* Badge mondial */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center rounded-full border border-teal-500/30 px-4 py-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 backdrop-blur-md shadow-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-teal-500 dark:bg-teal-400 mr-2 animate-pulse" />
              {t("hero.badge")}
            </motion.div>

            {/* Title with Gradient Text */}
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-zinc-900 dark:text-white"
            >
              {t("hero.title1")}{" "}
              <span className="bg-gradient-to-r from-teal-500 via-teal-400 to-indigo-500 dark:from-teal-400 dark:via-emerald-400 dark:to-indigo-400 bg-clip-text text-transparent">
                {t("hero.title2")}
              </span>
            </motion.h1>

            {/* Paragraphs description */}
            <div className="space-y-4 max-w-2xl">
              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg md:text-xl text-zinc-700 dark:text-zinc-300 font-semibold"
              >
                {t("hero.subtitle")}
              </motion.p>
            </div>

            {/* Interactive Call-To-Action buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center gap-4 pt-2"
            >
              <Link 
                href="/register" 
                className="group relative inline-flex items-center justify-center rounded-xl text-sm font-bold transition-all bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white h-14 px-8 w-full sm:w-auto shadow-lg shadow-teal-500/20 overflow-hidden"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {t("hero.ctaStart")}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="/courses" 
                className="inline-flex items-center justify-center rounded-xl text-sm font-bold transition-all border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-white/70 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white h-14 px-8 w-full sm:w-auto backdrop-blur-sm shadow-sm"
              >
                {t("hero.ctaExplore")}
              </Link>
            </motion.div>

            {/* Bottom Key Features */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left border-t border-zinc-200 dark:border-zinc-800/80 pt-8"
            >
              <div className="flex items-center gap-3">
                <div className="bg-teal-50 dark:bg-teal-950/50 p-2.5 rounded-xl border border-teal-200 dark:border-teal-500/20">
                  <BookOpen className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Création intuitive</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 dark:bg-indigo-950/50 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-500/20">
                  <GraduationCap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Quiz & Diplômes</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Paiements Globaux</span>
              </div>
            </motion.div>
          </div>

          {/* Right Visual Column (African Instructors Photo & Floating KPI Badges) */}
          <div className="lg:col-span-5 relative w-full aspect-square max-w-[520px] mx-auto lg:max-w-none">
            {/* Glowing background blob */}
            <div className="absolute inset-0 bg-gradient-to-tr from-teal-500 to-indigo-600 rounded-full blur-[80px] opacity-25 animate-pulse pointer-events-none" />

            <div className="relative w-full h-full flex items-center justify-center">
              
              {/* Main Photo Frame */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative w-full h-[95%] rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800/80 bg-zinc-900 shadow-2xl shadow-teal-500/10 group"
              >
                <Image
                  src="/hero-instructors.png"
                  alt="Formateurs Ansella joyeux et passionnés"
                  fill
                  priority
                  className="object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                
                {/* Overlay gradient at bottom for smooth contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Glassmorphic caption at the bottom of the photo */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/10 dark:bg-zinc-950/40 backdrop-blur-md border border-white/20 dark:border-white/10 text-white space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold tracking-wide">Créez vos cours avec Ansella</p>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-teal-500 text-white uppercase tracking-wider">Plateforme #1</span>
                  </div>
                  <p className="text-[11px] text-zinc-200">Rejoignez des milliers de créateurs de savoir à travers l'Afrique et le monde.</p>
                </div>
              </motion.div>

              {/* Floating Widget 1: Earnings */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -left-6 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xl flex items-center gap-3 max-w-[200px] z-20"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-500/15 border border-teal-200 dark:border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Ventes du jour</p>
                  <p className="text-sm font-black text-zinc-900 dark:text-white">$450.00</p>
                </div>
              </motion.div>

              {/* Floating Widget 2: Students */}
              <motion.div 
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -bottom-6 -right-6 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xl flex items-center gap-3 max-w-[200px] z-20"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Élèves actifs</p>
                  <p className="text-sm font-black text-zinc-900 dark:text-white">1,480</p>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
