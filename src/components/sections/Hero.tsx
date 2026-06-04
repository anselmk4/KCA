import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, GraduationCap, ShieldCheck } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-black text-white pt-24 pb-32 lg:pt-36 lg:pb-40">
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-left">
            <div className="inline-flex items-center rounded-full border border-blue-500/30 px-3 py-1 text-sm font-semibold mb-6 text-blue-400 bg-blue-950/50 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
              Plateforme SaaS Kuettu Pro
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-8 leading-tight text-white">
              Créez et Vendez vos Formations Web3 & IA
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 mb-10 max-w-xl">
              Kuettu Pro est la plateforme d'apprentissage tout-en-un conçue pour les instructeurs. Hébergez vos cours, évaluez vos élèves et encaissez vos gains facilement.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/register" className="inline-flex items-center justify-center rounded-lg text-base font-semibold transition-all bg-blue-600 text-white hover:bg-blue-500 h-14 px-8 w-full sm:w-auto shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                S'inscrire gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left border-t border-white/10 pt-8">
              <div className="flex items-center gap-3">
                <div className="bg-blue-900/40 p-2 rounded-lg border border-blue-500/20">
                  <BookOpen className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Création intuitive</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-purple-900/40 p-2 rounded-lg border border-purple-500/20">
                  <GraduationCap className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Quiz & Diplômes</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-cyan-900/40 p-2 rounded-lg border border-cyan-500/20">
                  <ShieldCheck className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Paiements Locaux</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative w-full aspect-square max-w-[500px] mx-auto lg:max-w-none flex justify-center">
            {/* Glowing background behind image */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full blur-[100px] opacity-30 animate-pulse"></div>
            
            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl backdrop-blur-sm bg-black/20">
              <Image 
                src="/images/hero.png" 
                alt="Web3 and AI Visualization" 
                fill 
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
