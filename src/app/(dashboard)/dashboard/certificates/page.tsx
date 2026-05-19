"use client";

import { useEffect, useState } from "react";
import { Award, Lock, Download, ExternalLink, CheckCircle2 } from "lucide-react";

export default function CertificatesPage() {
  const [userName, setUserName] = useState("Ansel");
  const [activeModule, setActiveModule] = useState("blockchain");

  useEffect(() => {
    const savedName = localStorage.getItem("kuettu_user_name");
    const savedModule = localStorage.getItem("kuettu_active_module");
    if (savedName) setUserName(savedName);
    if (savedModule) setActiveModule(savedModule);
  }, []);

  const moduleNames: Record<string, string> = {
    blockchain: "Fondamentaux de la Blockchain",
    trading: "Crypto-monnaie / Trading",
    ai: "Intelligence Artificielle",
    web3: "Développement Web3"
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Mes Certificats</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Vos accomplissements et diplômes obtenus sur Kuettu.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Main Active Certificate (Locked) */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col group">
          <div className="h-64 bg-zinc-100 dark:bg-zinc-800 relative flex items-center justify-center border-b border-zinc-200 dark:border-zinc-700">
            {/* Mock Diploma Graphic */}
            <div className="w-3/4 h-3/4 bg-white dark:bg-zinc-900 shadow-lg border-8 border-zinc-200 dark:border-zinc-700 p-6 flex flex-col items-center justify-center opacity-50 grayscale transition-all group-hover:opacity-75">
              <Award className="w-12 h-12 text-zinc-400 mb-2" />
              <p className="font-serif text-sm text-zinc-400 uppercase tracking-widest text-center">Certificat d'Accomplissement</p>
              <p className="font-bold text-zinc-500 mt-2 text-center text-sm">{moduleNames[activeModule]}</p>
            </div>
            
            {/* Lock Overlay */}
            <div className="absolute inset-0 bg-black/5 dark:bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-full shadow-xl">
                <Lock className="w-8 h-8 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
          </div>
          
          <div className="p-6 flex flex-col flex-1">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Certificat : {moduleNames[activeModule]}</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 flex-1">
              Ce certificat sera généré à votre nom ({userName}) une fois que vous aurez complété 100% des leçons et passé le quiz final avec succès.
            </p>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 mb-2 overflow-hidden">
              <div className="bg-zinc-400 h-2.5 rounded-full" style={{ width: '35%' }}></div>
            </div>
            <p className="text-xs text-zinc-500 font-semibold text-right">35% complété</p>
          </div>
        </div>

        {/* Empty State / Explanation */}
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30 p-8 flex flex-col justify-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-6">
            <Award className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Pourquoi obtenir nos certificats ?</h3>
          <ul className="space-y-4 text-zinc-600 dark:text-zinc-400">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <span>Démontrez votre expertise auprès des employeurs et partenaires d'affaires en Afrique et à l'international.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <span>Générez un lien unique de vérification pour votre profil LinkedIn.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <span>Accédez à des opportunités exclusives au sein du réseau Kuettu Pro.</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
