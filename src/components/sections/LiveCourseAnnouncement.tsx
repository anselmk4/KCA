"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  BookOpen, 
  Video, 
  Award,
  CheckCircle2,
  Zap,
  Users
} from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isStarted: boolean;
}

// Date de début : 1er Août 2026 à 08:00 GMT
const TARGET_DATE = new Date("2026-08-01T08:00:00Z").getTime();

export function LiveCourseAnnouncement() {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isStarted: false,
  });

  useEffect(() => {
    setMounted(true);
    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = TARGET_DATE - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isStarted: true });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, isStarted: false });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const isEn = language === "en";

  return (
    <section className="relative py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-20">
      {/* Container principal avec effets néon / glassmorphism */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative rounded-3xl p-6 sm:p-10 lg:p-12 overflow-hidden border border-teal-500/40 bg-gradient-to-br from-zinc-950 via-slate-900 to-zinc-950 shadow-[0_0_60px_rgba(20,184,166,0.18)] text-white backdrop-blur-2xl"
      >
        {/* Cercles de lueur d'arrière-plan */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none opacity-40" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* COLONNE GAUCHE: Informations sur la Formation & Formateur */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Badge événement en direct */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-teal-400/40 bg-teal-950/70 px-4 py-1.5 text-xs sm:text-sm font-semibold text-teal-300 shadow-inner backdrop-blur-md">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <span className="uppercase tracking-wider font-bold">
                {isEn ? "Live Event Announcement" : "Événement Exclusif • Session en Direct"}
              </span>
            </div>

            {/* Titre Principal de la Formation */}
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15]">
                {isEn ? "Formation:" : "Formation :"}{" "}
                <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-indigo-300 bg-clip-text text-transparent">
                  Introduction à la Blockchain
                </span>
                <span className="block text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-300 mt-1">
                  & Cryptomonnaies
                </span>
              </h2>
              <p className="text-zinc-300 text-base sm:text-lg leading-relaxed pt-2">
                {isEn 
                  ? "Join the flagship live training on Blockchain technology, smart contracts, and crypto ecosystem. Master the future of decentralized finance."
                  : "Rejoignez la grande formation en direct sur la technologie Blockchain, les smart contracts et l'écosystème crypto. Maîtrisez les fondamentaux de la finance décentralisée."}
              </p>
            </div>

            {/* Carte du Formateur Ansel Makomo */}
            <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 backdrop-blur-md">
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white font-black text-xl shadow-lg border-2 border-zinc-900">
                  AM
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-zinc-950 rounded-full p-0.5 border border-zinc-900" title="Formateur Certifié">
                  <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-zinc-950" />
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-white">Ansel Makomo</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30">
                    {isEn ? "Platform Expert" : "Formateur & Expert Blockchain"}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {isEn ? "Instructor & Community Lead on Kuettu Crypto Academy" : "Formateur certifié sur la plateforme Kuettu Crypto Academy"}
                </p>
              </div>
            </div>

            {/* Dates & Highlights Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-300 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
                <Calendar className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <div>
                  <span className="block text-[10px] text-zinc-400 uppercase font-bold">{isEn ? "Date" : "Date de début"}</span>
                  <span className="font-bold text-white">1er Août 2026</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-300 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
                <Clock className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <div>
                  <span className="block text-[10px] text-zinc-400 uppercase font-bold">{isEn ? "Time" : "Heure"}</span>
                  <span className="font-bold text-white">08:00 GMT</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-300 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800 col-span-2 sm:col-span-1">
                <Award className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <div>
                  <span className="block text-[10px] text-zinc-400 uppercase font-bold">{isEn ? "Certification" : "Certificat"}</span>
                  <span className="font-bold text-white">{isEn ? "Verifiable" : "Vérifiable Inclus"}</span>
                </div>
              </div>
            </div>

            {/* Boutons d'Action */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link 
                href="/register" 
                className="group relative inline-flex items-center justify-center rounded-xl text-sm font-extrabold transition-all bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400 hover:from-teal-400 hover:to-emerald-300 text-zinc-950 h-13 px-7 shadow-lg shadow-teal-500/25 overflow-hidden"
              >
                <span className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Sparkles className="mr-2 h-4 w-4 text-zinc-950 fill-zinc-950" />
                {isEn ? "Enroll in the Course" : "S'inscrire à la formation"}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="/courses" 
                className="inline-flex items-center justify-center rounded-xl text-sm font-bold transition-all border border-zinc-700 hover:border-teal-500/50 bg-zinc-900/70 hover:bg-zinc-800 text-zinc-200 hover:text-white h-13 px-6 shadow-sm"
              >
                <BookOpen className="mr-2 h-4 w-4 text-teal-400" />
                {isEn ? "View Program" : "Découvrir le Programme"}
              </Link>
            </div>

          </div>

          {/* COLONNE DROITE: COMPTE À REBOURS GÉANT */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            
            <div className="w-full max-w-md bg-zinc-900/90 border border-teal-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative group">
              {/* Effet néon d'arrière-plan */}
              <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-indigo-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-700 pointer-events-none" />

              <div className="relative z-10 text-center space-y-6">
                
                <div className="flex items-center justify-center gap-2 text-teal-400 font-extrabold text-sm uppercase tracking-widest">
                  <Zap className="w-4 h-4 fill-teal-400 animate-pulse" />
                  <span>{isEn ? "Countdown to Launch" : "Compte à Rebours Avant Début"}</span>
                </div>

                {!mounted ? (
                  <div className="h-32 flex items-center justify-center">
                    <span className="text-zinc-500 text-sm animate-pulse">{isEn ? "Loading timer..." : "Chargement du compte à rebours..."}</span>
                  </div>
                ) : timeLeft.isStarted ? (
                  <div className="py-6 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                    <p className="text-2xl font-black uppercase tracking-wide">
                      {isEn ? "The Course Has Started!" : "La formation a commencé !"}
                    </p>
                    <p className="text-xs text-zinc-300 mt-2">
                      {isEn ? "Join the live session now on the platform." : "Rejoignez la session en direct dès maintenant."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 sm:gap-3 my-2">
                    
                    {/* JOURS */}
                    <div className="flex flex-col items-center">
                      <div className="w-full aspect-square bg-slate-950/90 border border-teal-500/40 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-teal-100 to-teal-300 font-mono tracking-tight">
                          {String(timeLeft.days).padStart(2, "0")}
                        </span>
                      </div>
                      <span className="mt-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-teal-400">
                        {isEn ? "Days" : "Jours"}
                      </span>
                    </div>

                    {/* HEURES */}
                    <div className="flex flex-col items-center">
                      <div className="w-full aspect-square bg-slate-950/90 border border-teal-500/40 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-teal-100 to-teal-300 font-mono tracking-tight">
                          {String(timeLeft.hours).padStart(2, "0")}
                        </span>
                      </div>
                      <span className="mt-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-teal-400">
                        {isEn ? "Hours" : "Heures"}
                      </span>
                    </div>

                    {/* MINUTES */}
                    <div className="flex flex-col items-center">
                      <div className="w-full aspect-square bg-slate-950/90 border border-teal-500/40 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-teal-100 to-teal-300 font-mono tracking-tight">
                          {String(timeLeft.minutes).padStart(2, "0")}
                        </span>
                      </div>
                      <span className="mt-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-teal-400">
                        {isEn ? "Mins" : "Minutes"}
                      </span>
                    </div>

                    {/* SECONDES */}
                    <div className="flex flex-col items-center">
                      <div className="w-full aspect-square bg-slate-950/90 border border-teal-500/40 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-teal-100 to-teal-300 font-mono tracking-tight">
                          {String(timeLeft.seconds).padStart(2, "0")}
                        </span>
                      </div>
                      <span className="mt-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-teal-400">
                        {isEn ? "Secs" : "Secondes"}
                      </span>
                    </div>

                  </div>
                )}

                {/* Footnote under timer */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-center gap-2 text-xs text-zinc-400">
                  <Video className="w-3.5 h-3.5 text-teal-400" />
                  <span>{isEn ? "Live streaming on Kuettu Crypto Academy" : "Diffusion en direct sur Kuettu Crypto Academy"}</span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </motion.div>
    </section>
  );
}
