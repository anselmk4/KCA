"use client";

import { useEffect, useState } from "react";
import { getDB, saveDB, Database } from "@/lib/db";
import { getSimulatedSession, setSimulatedSession, CurrentSession } from "@/lib/rbac";
import { Check, CreditCard, Sparkles, Zap, Award, CheckCircle2, ShieldAlert } from "lucide-react";

export default function BillingPage() {
  const [session, setSession] = useState<CurrentSession | null>(null);
  const [db, setDb] = useState<Database | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setSession(getSimulatedSession());
    setDb(getDB());
  }, []);

  if (!session || !db) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-32 animate-pulse" />
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-32 animate-pulse" />
        </div>
      </div>
    );
  }

  // Calculate usage stats dynamically based on database
  const myCourses = db.courses.filter(c => c.instructorId === (session?.userId ?? ""));
  const myCourseIds = myCourses.map(c => c.id);
  const myEnrollments = db.enrollments.filter(e => myCourseIds.includes(e.courseId));
  const totalStudents = new Set(myEnrollments.map(e => e.studentId)).size;

  const currentPlan = session.plan || "FREE";

  const limits = {
    FREE: { courses: 1, students: 15, fee: "5%" },
    PRO: { courses: 10, students: 200, fee: "2%" },
    MAX: { courses: Infinity, students: Infinity, fee: "0%" }
  };

  const currentLimit = limits[currentPlan];

  // Progress percentages
  const coursesPercent = currentLimit.courses === Infinity 
    ? 0 
    : Math.min((myCourses.length / currentLimit.courses) * 100, 100);

  const studentsPercent = currentLimit.students === Infinity 
    ? 0 
    : Math.min((totalStudents / currentLimit.students) * 100, 100);

  const handleUpgradePlan = (newPlan: "FREE" | "PRO" | "MAX") => {
    if (newPlan === currentPlan) return;
    
    setLoading(true);
    setSuccessMsg(null);

    setTimeout(() => {
      // Update local storage database
      const database = getDB();
      const updatedUsers = database.users.map(u => {
        if (u.id === session?.userId) {
          return { ...u, plan: newPlan };
        }
        return u;
      });
      database.users = updatedUsers;
      saveDB(database);

      // Update session state
      const updatedSession = {
        ...session,
        plan: newPlan
      };
      setSimulatedSession(updatedSession);
      setSession(updatedSession);
      setDb(database);
      setLoading(false);
      setSuccessMsg(`Votre abonnement a été mis à jour avec succès au plan ${newPlan} !`);

      // Hide message after 4s
      setTimeout(() => setSuccessMsg(null), 4000);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
          Gestion de l'Abonnement
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Suivez votre consommation de ressources et mettez à niveau votre forfait d'académie.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl flex items-start gap-3 text-emerald-600 text-sm font-semibold animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Usage Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Course Limit Card */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Cours hébergés</span>
              <span className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full text-zinc-600 dark:text-zinc-300">
                Limite : {currentLimit.courses === Infinity ? "Illimitée" : `${currentLimit.courses}`}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">{myCourses.length}</span>
              <span className="text-zinc-400 text-sm">
                / {currentLimit.courses === Infinity ? "Illimités" : `${currentLimit.courses} cours`}
              </span>
            </div>
          </div>
          {currentLimit.courses !== Infinity ? (
            <div className="space-y-2 mt-4">
              <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    coursesPercent >= 90 ? "bg-red-500" : coursesPercent >= 70 ? "bg-amber-500" : "bg-teal-500"
                  }`}
                  style={{ width: `${coursesPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>{Math.round(coursesPercent)}% consommé</span>
                <span>{currentLimit.courses - myCourses.length} restants</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-teal-600 font-semibold mt-4">Forfait illimité. Aucun quota applicable.</p>
          )}
        </div>

        {/* Student Limit Card */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Apprenants inscrits</span>
              <span className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full text-zinc-600 dark:text-zinc-300">
                Limite : {currentLimit.students === Infinity ? "Illimitée" : `${currentLimit.students}`}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">{totalStudents}</span>
              <span className="text-zinc-400 text-sm">
                / {currentLimit.students === Infinity ? "Illimités" : `${currentLimit.students} élèves`}
              </span>
            </div>
          </div>
          {currentLimit.students !== Infinity ? (
            <div className="space-y-2 mt-4">
              <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    studentsPercent >= 90 ? "bg-red-500" : studentsPercent >= 70 ? "bg-amber-500" : "bg-teal-500"
                  }`}
                  style={{ width: `${studentsPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>{Math.round(studentsPercent)}% consommé</span>
                <span>{currentLimit.students - totalStudents} restants</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-teal-600 font-semibold mt-4">Forfait illimité. Aucun quota applicable.</p>
          )}
        </div>
      </div>

      {/* Warning banner for limit reached */}
      {currentPlan === "FREE" && (myCourses.length >= currentLimit.courses || totalStudents >= currentLimit.students) && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex items-start gap-3 text-amber-800 dark:text-amber-400 text-sm font-medium">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
          <div>
            <p className="font-bold">Quota de ressources épuisé</p>
            <p className="text-xs mt-1 text-zinc-500 dark:text-zinc-400">Vous avez atteint les limites du forfait gratuit. Pour ajouter de nouveaux cours ou accueillir plus d'élèves, veuillez souscrire au Plan Pro.</p>
          </div>
        </div>
      )}

      {/* Plans Section */}
      <div className="pt-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">
          Tous nos Forfaits
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan Free Card */}
          <div className={`bg-white dark:bg-zinc-900 p-6 rounded-2xl border flex flex-col justify-between h-full relative ${
            currentPlan === "FREE" ? "border-teal-500 shadow-md ring-1 ring-teal-500" : "border-zinc-200 dark:border-zinc-800"
          }`}>
            {currentPlan === "FREE" && (
              <span className="absolute -top-3 right-4 bg-teal-500 text-white text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full">
                Actif
              </span>
            )}
            <div>
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Plan Free</h3>
              <p className="text-xs text-zinc-400 mt-1 min-h-[48px]">Pour tester votre académie auprès d'un premier panel.</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">0$</span>
                <span className="text-zinc-400 text-sm ml-1">/ mois</span>
              </div>
              <ul className="space-y-3 mb-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <Check className="w-4 h-4 text-teal-600" /> 1 cours actif maximum
                </li>
                <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <Check className="w-4 h-4 text-teal-600" /> 15 apprenants max
                </li>
                <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <Check className="w-4 h-4 text-teal-600" /> 5% frais de transaction
                </li>
              </ul>
            </div>
            <button 
              disabled={currentPlan === "FREE" || loading}
              onClick={() => handleUpgradePlan("FREE")}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                currentPlan === "FREE"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-default"
                  : "bg-zinc-800 hover:bg-zinc-700 text-white"
              }`}
            >
              Activer gratuitement
            </button>
          </div>

          {/* Plan Pro Card */}
          <div className={`bg-white dark:bg-zinc-900 p-6 rounded-2xl border flex flex-col justify-between h-full relative ${
            currentPlan === "PRO" ? "border-teal-500 shadow-md ring-1 ring-teal-500" : "border-zinc-200 dark:border-zinc-800"
          }`}>
            {currentPlan === "PRO" && (
              <span className="absolute -top-3 right-4 bg-teal-500 text-white text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full">
                Actif
              </span>
            )}
            <div>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Plan Pro</h3>
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold text-[9px] uppercase tracking-wide px-2 py-0.5 rounded-full">Recommandé</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 min-h-[48px]">Idéal pour les académies et formateurs professionnels.</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">49$</span>
                <span className="text-zinc-400 text-sm ml-1">/ mois</span>
              </div>
              <ul className="space-y-3 mb-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <Check className="w-4 h-4 text-teal-600" /> Jusqu'à 10 cours actifs
                </li>
                <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <Check className="w-4 h-4 text-teal-600" /> 200 apprenants max
                </li>
                <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <Check className="w-4 h-4 text-teal-600" /> 2% frais de transaction
                </li>
                <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <Check className="w-4 h-4 text-teal-600" /> Certificats automatisés
                </li>
              </ul>
            </div>
            <button 
              disabled={currentPlan === "PRO" || loading}
              onClick={() => handleUpgradePlan("PRO")}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                currentPlan === "PRO"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-default"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
              }`}
            >
              {currentPlan === "FREE" ? "Passer au Plan Pro" : "Retourner au Plan Pro"}
            </button>
          </div>

          {/* Plan Max Card */}
          <div className={`bg-white dark:bg-zinc-900 p-6 rounded-2xl border flex flex-col justify-between h-full relative ${
            currentPlan === "MAX" ? "border-teal-500 shadow-md ring-1 ring-teal-500" : "border-zinc-200 dark:border-zinc-800"
          }`}>
            {currentPlan === "MAX" && (
              <span className="absolute -top-3 right-4 bg-teal-500 text-white text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full">
                Actif
              </span>
            )}
            <div>
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Plan Max</h3>
              <p className="text-xs text-zinc-400 mt-1 min-h-[48px]">Pour les écoles d'envergure exigeant une puissance illimitée.</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">200$</span>
                <span className="text-zinc-400 text-sm ml-1">/ mois</span>
              </div>
              <ul className="space-y-3 mb-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <Check className="w-4 h-4 text-teal-600" /> Cours et élèves illimités
                </li>
                <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <Check className="w-4 h-4 text-teal-600" /> 0% de frais de transaction
                </li>
                <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <Check className="w-4 h-4 text-teal-600" /> Nom de domaine personnalisé
                </li>
                <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <Check className="w-4 h-4 text-teal-600" /> Support VIP WhatsApp 24/7
                </li>
              </ul>
            </div>
            <button 
              disabled={currentPlan === "MAX" || loading}
              onClick={() => handleUpgradePlan("MAX")}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                currentPlan === "MAX"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-default"
                  : "bg-zinc-850 hover:bg-zinc-800 text-white"
              }`}
            >
              Mettre à niveau (Plan Max)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
