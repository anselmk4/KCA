"use client";

import { useEffect, useState } from "react";
import { PlayCircle, Clock, BookOpen, CheckCircle2, TrendingUp, BrainCircuit, Bitcoin, Code2 } from "lucide-react";

export default function MyCoursesPage() {
  const [activeModule, setActiveModule] = useState<string>("blockchain");

  useEffect(() => {
    const savedModule = localStorage.getItem("kuettu_active_module");
    if (savedModule) setActiveModule(savedModule);
  }, []);

  const courseData: Record<string, { title: string; icon: any; color: string; bgColor: string; progress: string; time: string; lessons: string; totalLessons: number; completedLessons: number }> = {
    blockchain: {
      title: "Fondamentaux de la Blockchain",
      icon: <Bitcoin className="w-8 h-8 text-blue-600" />,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      progress: "35%",
      time: "2h 30m restantes",
      lessons: "Leçon 4/12",
      totalLessons: 12,
      completedLessons: 4
    },
    trading: {
      title: "Crypto-monnaie / Trading",
      icon: <TrendingUp className="w-8 h-8 text-emerald-600" />,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      progress: "15%",
      time: "15h 45m restantes",
      lessons: "Leçon 2/24",
      totalLessons: 24,
      completedLessons: 2
    },
    ai: {
      title: "Intelligence Artificielle",
      icon: <BrainCircuit className="w-8 h-8 text-purple-600" />,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      progress: "5%",
      time: "22h 10m restantes",
      lessons: "Leçon 1/30",
      totalLessons: 30,
      completedLessons: 1
    },
    web3: {
      title: "Développement Web3",
      icon: <Code2 className="w-8 h-8 text-orange-600" />,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      progress: "0%",
      time: "40h restantes",
      lessons: "Leçon 0/45",
      totalLessons: 45,
      completedLessons: 0
    }
  };

  const activeCourse = courseData[activeModule] || courseData["blockchain"];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Mes Formations</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Suivez votre progression et accédez à vos cours actuels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Active Course */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="mb-6 flex justify-between items-start">
            <div className={`w-16 h-16 ${activeCourse.bgColor} dark:bg-opacity-20 rounded-2xl flex items-center justify-center`}>
              {activeCourse.icon}
            </div>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              En cours
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-zinc-900 dark:text-white">{activeCourse.title}</h2>
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {activeCourse.time}</span>
            <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {activeCourse.completedLessons} / {activeCourse.totalLessons} leçons complétées</span>
          </div>
          
          <div className="mt-auto">
            <div className="flex justify-between text-sm font-semibold mb-2">
              <span className="text-zinc-700 dark:text-zinc-300">Progression</span>
              <span className={activeCourse.color}>{activeCourse.progress}</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 mb-6 overflow-hidden">
              <div className={`h-3 rounded-full bg-blue-600`} style={{ width: activeCourse.progress }}></div>
            </div>
            <button className="w-full flex items-center justify-center py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
              <PlayCircle className="w-5 h-5 mr-2" />
              Reprendre la lecture
            </button>
          </div>
        </div>

        {/* Locked / Upcoming courses placeholder */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Parcours verrouillés</h3>
          
          {Object.keys(courseData).filter(k => k !== activeModule).map(key => {
            const course = courseData[key];
            return (
              <div key={key} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between opacity-70 grayscale">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${course.bgColor} dark:bg-opacity-20 rounded-xl flex items-center justify-center`}>
                    {course.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white">{course.title}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{course.totalLessons} leçons</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-bold rounded-full">
                  Verrouillé
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
