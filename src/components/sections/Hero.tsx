"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, ShieldCheck, DollarSign, Users, Play } from "lucide-react";
import { motion } from "framer-motion";

export function Hero() {
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
            
            {/* Tag Congolais avec Animation d'entrée */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center rounded-full border border-teal-500/20 px-4 py-1.5 text-xs font-bold text-teal-400 bg-teal-950/30 backdrop-blur-md shadow-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-teal-400 mr-2 animate-pulse" />
              🇨🇩 Plateforme 100% Congolaise
            </motion.div>

            {/* Title with Gradient Text */}
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-zinc-900 dark:text-white"
            >
              Créez, vendez vos formations{" "}
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">
                partout et facilement.
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
                ANSELLA est une plateforme 100% Congolaise tout-en-un.
              </motion.p>
              
              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed"
              >
                Hébergez vos cours, évaluez vos apprenants, encaissez vos gains en Mobile Money — et faites grandir votre académie sans limite.
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
                {/* Glow button border animation effect */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                Créer mon académie gratuitement
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="/courses" 
                className="inline-flex items-center justify-center rounded-xl text-sm font-bold transition-all border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-750 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white h-14 px-8 w-full sm:w-auto backdrop-blur-sm"
              >
                Voir le catalogue
              </Link>
            </motion.div>

            {/* Bottom Key Features */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left border-t border-zinc-800/80 pt-8"
            >
              <div className="flex items-center gap-3">
                <div className="bg-teal-950/50 p-2.5 rounded-xl border border-teal-500/20">
                  <BookOpen className="h-5 w-5 text-teal-400" />
                </div>
                <span className="text-sm font-semibold text-zinc-300">Création intuitive</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-indigo-950/50 p-2.5 rounded-xl border border-indigo-500/20">
                  <GraduationCap className="h-5 w-5 text-indigo-400" />
                </div>
                <span className="text-sm font-semibold text-zinc-300">Quiz & Diplômes</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-500/20">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <span className="text-sm font-semibold text-zinc-300">Paiements Locaux</span>
              </div>
            </motion.div>
          </div>

          {/* Right Visual Column (Floating cards and dashboard mock) */}
          <div className="lg:col-span-5 relative w-full aspect-square max-w-[500px] mx-auto lg:max-w-none">
            {/* Glowing background blob */}
            <div className="absolute inset-0 bg-gradient-to-tr from-teal-500 to-indigo-600 rounded-full blur-[80px] opacity-20 animate-pulse pointer-events-none" />

            <div className="relative w-full h-full flex items-center justify-center">
              
              {/* Main dashboard mock frame */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative w-full h-[90%] rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md shadow-2xl p-6 flex flex-col gap-6"
              >
                {/* Header Mock */}
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-900 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-[10px] text-zinc-650 dark:text-zinc-400 bg-zinc-100/50 dark:bg-zinc-900/60 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800/50 font-mono">ansella.app/dashboard</span>
                </div>

                {/* Simulated course creation layout */}
                <div className="flex-1 space-y-4">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-900 rounded-lg w-1/3" />
                  <div className="h-8 bg-zinc-200/50 dark:bg-zinc-900/50 rounded-xl w-3/4" />
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-zinc-100/20 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4 space-y-1">
                      <p className="text-[10px] text-zinc-500 font-semibold uppercase">Revenus du mois</p>
                      <p className="text-xl font-bold text-teal-400">$3,420</p>
                    </div>
                    <div className="bg-zinc-100/20 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4 space-y-1">
                      <p className="text-[10px] text-zinc-500 font-semibold uppercase">Nouveaux élèves</p>
                      <p className="text-xl font-bold text-indigo-400">+124</p>
                    </div>
                  </div>
                  <div className="border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4 bg-zinc-100/20 dark:bg-zinc-900/10 space-y-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                        <Play className="w-4 h-4 text-teal-400 fill-teal-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-white">Introduction au Web3</p>
                        <p className="text-[9px] text-zinc-500">Vidéo • 12:45 min</p>
                      </div>
                    </div>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">En ligne</span>
                  </div>
                </div>
              </motion.div>

              {/* Floating Widget 1: Earnings (Micro-parallaxe / float animation) */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -left-6 bg-white/85 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-850 rounded-2xl p-4 shadow-xl flex items-center gap-3 max-w-[190px]"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Ventes du jour</p>
                  <p className="text-sm font-black text-zinc-900 dark:text-white">$450.00</p>
                </div>
              </motion.div>

              {/* Floating Widget 2: Students (Micro-parallaxe contrarié) */}
              <motion.div 
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -bottom-6 -right-6 bg-white/85 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-850 rounded-2xl p-4 shadow-xl flex items-center gap-3 max-w-[200px]"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
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
