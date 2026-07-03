"use client";

import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

export default function ConfirmedPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950 font-sans relative overflow-hidden">
      {/* Abstract Glowing shapes */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 dark:bg-blue-600/5 rounded-full blur-[120px] -mr-40 -mt-40 animate-pulse duration-[6000ms] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-[120px] -ml-40 -mb-40 animate-pulse duration-[8000ms] pointer-events-none" />

      {/* Header Branding */}
      <header className="z-10 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <Link href="/">
          <Image src="/logo.png" alt="ANSELLA Logo" width={140} height={42} className="object-contain h-9 w-auto" priority />
        </Link>
      </header>

      {/* Main card */}
      <main className="z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200/80 dark:border-white/10 p-8 md:p-10 relative overflow-hidden transition-all duration-300 flex flex-col items-center text-center">
          
          {/* Success Check Badge */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md scale-110 animate-pulse" />
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 relative z-10">
              <CheckCircle2 className="w-12 h-12 stroke-[2.5] animate-[bounce_1s_infinite_alternate]" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-4 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Compte Validé avec succès</span>
          </div>

          <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-3 tracking-tight">
            Félicitations !
          </h1>
          
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed max-w-sm">
            Votre adresse email a été vérifiée avec succès. Votre compte est maintenant activé et prêt à être utilisé sur la plateforme ANSELLA.
          </p>

          <Link
            href="/login"
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] duration-200 cursor-pointer text-sm"
          >
            <span>Se connecter à mon Espace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="mt-6 flex items-center gap-2 text-xxs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Plateforme Sécurisée ANSELLA</span>
          </div>

        </div>
      </main>

      {/* Footer Branding */}
      <footer className="z-10 w-full text-center py-6 text-xs text-zinc-450 dark:text-zinc-500">
        © {new Date().getFullYear()} Ansella Inc. Tous droits réservés.
      </footer>
    </div>
  );
}
