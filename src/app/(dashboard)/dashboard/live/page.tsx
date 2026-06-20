"use client";

import { Video, Calendar, Clock, User, ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LiveSessionsPage() {
  const upcomingSessions = [
    {
      id: "live_1",
      title: "Introduction pratique aux Smart Contracts Solidity",
      instructor: "Prof. Kuettu",
      date: "Dans 2 jours (Mardi 22 Juin à 18:00 UTC)",
      duration: "90 min",
      description: "Session en direct interactive pour déployer votre premier smart contract sur le testnet Sepolia et interagir avec via Ethers.js."
    },
    {
      id: "live_2",
      title: "Analyse technique & Gestion du risque en Bull Market",
      instructor: "Prof. Kuettu",
      date: "Dans 5 jours (Vendredi 25 Juin à 19:00 UTC)",
      duration: "120 min",
      description: "Session de questions-réponses en direct sur l'identification des configurations de trading à haute probabilité et le calcul de taille de position."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
          <Video className="w-5 h-5 animate-pulse" />
          <span className="text-xs font-bold tracking-[0.2em] uppercase font-mono">En direct</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Sessions Live & Q/R</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Rejoignez les cours en direct et posez vos questions en temps réel à vos instructeurs.</p>
      </div>

      {/* Main Status Block */}
      <div className="bg-zinc-900 text-white rounded-3xl p-8 border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-lg">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
              <span className="w-2 h-2 rounded-full bg-zinc-500" />
              Hors ligne
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight">Aucun live en cours pour le moment</h2>
            <p className="text-zinc-400 text-sm">
              Les sessions en direct sont programmées à l'avance. Quand un live commencera, un bouton de connexion apparaîtra ici pour rejoindre la salle virtuelle (Zoom/Meet).
            </p>
          </div>
          <div className="shrink-0">
            <button className="px-6 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-50 border border-zinc-700 rounded-xl font-bold transition-all text-sm cursor-not-allowed">
              Rejoindre la salle
            </button>
          </div>
        </div>
      </div>

      {/* Scheduled Sessions */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Sessions programmées
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upcomingSessions.map(session => (
            <div key={session.id} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-zinc-900 dark:text-white leading-snug line-clamp-2 text-sm">{session.title}</h4>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3">{session.description}</p>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <span>{session.date}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {session.instructor}</span>
                  <span className="font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">{session.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Prompt */}
      <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between">
        <div>
          <h4 className="font-bold text-zinc-900 dark:text-white mb-1">Besoin d&apos;étudier d&apos;ici là ?</h4>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Poursuivez vos modules d&apos;apprentissage autonomes.</p>
        </div>
        <Link href="/dashboard/courses" className="mt-4 sm:mt-0 px-5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 text-sm">
          Mes formations <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
