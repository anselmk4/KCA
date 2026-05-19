"use client";

import { useState, useEffect } from "react";
import { PlayCircle, Clock, BookOpen, ChevronRight, TrendingUp, BrainCircuit, Bitcoin, Code2 } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [activeModule, setActiveModule] = useState<string>("blockchain");
  const [userLevel, setUserLevel] = useState<string>("Débutant");
  const [userName, setUserName] = useState<string>("Ansel");

  useEffect(() => {
    // Read from localStorage on mount
    const savedModule = localStorage.getItem("kuettu_active_module");
    const savedLevel = localStorage.getItem("kuettu_user_level");
    const savedName = localStorage.getItem("kuettu_user_name");
    
    if (savedModule) setActiveModule(savedModule);
    if (savedLevel) setUserLevel(savedLevel);
    if (savedName) setUserName(savedName);
  }, []);

  const courseData: Record<string, { title: string; icon: any; color: string; bgColor: string; progress: string; time: string; lessons: string }> = {
    blockchain: {
      title: "Fondamentaux de la Blockchain",
      icon: <Bitcoin className="w-10 h-10 text-blue-600" />,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      progress: "35%",
      time: "2h 30m restantes",
      lessons: "Leçon 4/12"
    },
    trading: {
      title: "Crypto-monnaie / Trading",
      icon: <TrendingUp className="w-10 h-10 text-emerald-600" />,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      progress: "15%",
      time: "15h 45m restantes",
      lessons: "Leçon 2/24"
    },
    ai: {
      title: "Intelligence Artificielle",
      icon: <BrainCircuit className="w-10 h-10 text-purple-600" />,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      progress: "5%",
      time: "22h 10m restantes",
      lessons: "Leçon 1/30"
    },
    web3: {
      title: "Développement Web3",
      icon: <Code2 className="w-10 h-10 text-orange-600" />,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      progress: "0%",
      time: "40h restantes",
      lessons: "Leçon 0/45"
    }
  };

  const activeCourse = courseData[activeModule] || courseData["blockchain"];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Bon retour, {userName} !</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Niveau actuel : <span className="font-semibold text-zinc-700 dark:text-zinc-300">{userLevel}</span>. Prêt à continuer votre apprentissage ?</p>
        </div>
        <button className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/30">
          Reprendre le cours
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Progress & Active Course */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Course Card */}
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Formation en cours</h2>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className={`w-full sm:w-32 h-32 sm:h-24 ${activeCourse.bgColor} dark:bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0`}>
                  {activeCourse.icon}
                </div>
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md mb-2 inline-block">Actif</span>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{activeCourse.title}</h3>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {activeCourse.time}</span>
                    <span className="flex items-center gap-1"><PlayCircle className="w-4 h-4" /> {activeCourse.lessons}</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: activeCourse.progress }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">Heures d'apprentissage</p>
              <h4 className="text-3xl font-bold text-zinc-900 dark:text-white">12.5h</h4>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">Certificats obtenus</p>
              <h4 className="text-3xl font-bold text-zinc-900 dark:text-white">0</h4>
            </div>
          </div>
        </div>

        {/* Right Column: Recommendations */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Recommandé pour vous</h2>
          
          {activeModule !== "trading" && (
            <Link href="/register?module=trading" className="block bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm group hover:border-emerald-500 transition-colors">
              <div className="h-32 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl mb-4 flex items-center justify-center">
                 <span className="font-bold text-emerald-600">Trading & Crypto</span>
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-white mb-1">Analyse Technique Avancée</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Apprenez à lire les graphiques comme un pro.</p>
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-zinc-900 dark:text-white">500$</span>
                <span className="text-emerald-600 font-medium flex items-center">Découvrir <ChevronRight className="w-4 h-4 ml-1" /></span>
              </div>
            </Link>
          )}

          {activeModule !== "ai" && (
            <Link href="/register?module=ai" className="block bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm group hover:border-purple-500 transition-colors">
              <div className="h-32 bg-purple-100 dark:bg-purple-900/20 rounded-xl mb-4 flex items-center justify-center">
                 <span className="font-bold text-purple-600">Intelligence Artificielle</span>
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-white mb-1">Automatisation Web3</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Créez des agents IA pour le trading.</p>
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-zinc-900 dark:text-white">1000$</span>
                <span className="text-purple-600 font-medium flex items-center">Découvrir <ChevronRight className="w-4 h-4 ml-1" /></span>
              </div>
            </Link>
          )}

          {activeModule !== "web3" && (
            <Link href="/register?module=web3" className="block bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm group hover:border-orange-500 transition-colors">
              <div className="h-32 bg-orange-100 dark:bg-orange-900/20 rounded-xl mb-4 flex items-center justify-center">
                 <span className="font-bold text-orange-600">Développement Web3</span>
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-white mb-1">Smart Contracts & dApps</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Créez vos propres applications décentralisées.</p>
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-zinc-900 dark:text-white">1500$</span>
                <span className="text-orange-600 font-medium flex items-center">Découvrir <ChevronRight className="w-4 h-4 ml-1" /></span>
              </div>
            </Link>
          )}
          
        </div>
      </div>
    </div>
  );
}
