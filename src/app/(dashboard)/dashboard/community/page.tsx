"use client";

import { MessageCircle, Video, Calendar, ArrowRight, Users } from "lucide-react";

export default function CommunityPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Communauté Kuettu</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Rejoignez l'élite, posez vos questions et participez aux sessions live.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Discord / Telegram VIP Access */}
        <div className="space-y-6">
          <div className="bg-[#5865F2] rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-[#5865F2]/20 group">
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Serveur Discord Privé</h2>
              <p className="text-white/80 mb-8 max-w-sm">
                Accédez au salon VIP réservé aux étudiants. Échangez avec les mentors, partagez vos analyses et trouvez des partenaires.
              </p>
              <button className="px-6 py-3 bg-white text-[#5865F2] font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-transform">
                Rejoindre le Discord <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            {/* Background decoration */}
            <Users className="absolute -bottom-8 -right-8 w-48 h-48 text-white/10 group-hover:scale-110 transition-transform duration-500" />
          </div>

          <div className="bg-[#0088cc] rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-[#0088cc]/20 group">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-bold mb-2">Canal Telegram (Signaux)</h2>
                <p className="text-white/80 text-sm max-w-xs">
                  Recevez les analyses de marché et opportunités en temps réel (Inclus avec Trading).
                </p>
              </div>
              <button className="shrink-0 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md font-bold rounded-xl transition-colors">
                Accéder au canal
              </button>
            </div>
          </div>
        </div>

        {/* Live Sessions Agenda */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-600">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Prochains Lives</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Sessions Q&A et Masterclasses</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 text-center min-w-[80px] shadow-sm border border-zinc-200 dark:border-zinc-800">
                <p className="text-xs font-bold text-red-600 uppercase">Ce soir</p>
                <p className="text-xl font-black text-zinc-900 dark:text-white">20:00</p>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-zinc-900 dark:text-white">Revue de marché Crypto hebdomadaire</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-1">
                  <Users className="w-4 h-4" /> Mentor: Coach Cédric
                </p>
              </div>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-red-500/20">
                Participer
              </button>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 text-center min-w-[80px] shadow-sm border border-zinc-200 dark:border-zinc-800">
                <p className="text-xs font-bold text-zinc-500 uppercase">Jeu. 15</p>
                <p className="text-xl font-black text-zinc-900 dark:text-white">18:30</p>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-zinc-900 dark:text-white">Q&A: Automatisation avec l'IA</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-1">
                  <Users className="w-4 h-4" /> Mentor: Sarah
                </p>
              </div>
              <button className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl text-sm hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors">
                Rappel
              </button>
            </div>
            
            <div className="pt-4 text-center">
              <button className="text-sm text-blue-600 font-semibold hover:underline flex items-center justify-center w-full gap-1">
                Voir tout le calendrier <Calendar className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
