"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, BookOpen } from "lucide-react";
import { addUser, initDB } from "@/lib/db";
import { setSimulatedSession } from "@/lib/rbac";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  
  // Form fields
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [academyName, setAcademyName] = useState<string>("");
  const [thematic, setThematic] = useState<string>("blockchain");
  const [selectedPlan, setSelectedPlan] = useState<"FREE" | "PRO" | "MAX">("FREE");

  useEffect(() => {
    initDB();
    const queryPlan = searchParams.get("plan")?.toUpperCase();
    if (queryPlan === "FREE" || queryPlan === "PRO" || queryPlan === "MAX") {
      setSelectedPlan(queryPlan as "FREE" | "PRO" | "MAX");
    }
  }, [searchParams]);

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create new instructor user in the local database
    const newUser = addUser({
      name: name || "Ansel Instructeur",
      email: email || "ansel@example.com",
      role: "INSTRUCTOR",
      plan: selectedPlan,
      level: academyName || "Mon Académie",
      activeCourse: thematic
    });

    // Update simulated session to login as this instructor
    setSimulatedSession({
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: "INSTRUCTOR",
      status: "ACTIVE",
      plan: newUser.plan
    });

    // Store academic info in localStorage for display consistency
    localStorage.setItem("kuettu_academy_name", academyName || "Mon Académie");
    localStorage.setItem("kuettu_academy_thematic", thematic);
    
    // Redirect to the instructor area
    router.push("/instructor");
  };

  return (
    <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-white/10 p-8 relative overflow-hidden">
      
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-zinc-100 dark:bg-zinc-800">
        <div 
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${(step / 2) * 100}%` }}
        />
      </div>

      <div className="flex flex-col items-center mb-8 mt-4">
        <Link href="/" className="flex items-center space-x-2 mb-4">
          <GraduationCap className="h-10 w-10 text-blue-600" />
          <span className="font-bold text-2xl text-zinc-900 dark:text-white">Kuettu Pro</span>
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 text-center">
          {step === 1 && "Créer un compte Formateur"}
          {step === 2 && "Configurez votre Académie"}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-center text-sm">
          {step === 1 && "Lancer et monétisez votre école en ligne en quelques clics."}
          {step === 2 && "Choisissez votre thématique et confirmez votre forfait."}
        </p>
      </div>

      <form onSubmit={step === 2 ? handleComplete : (e) => { e.preventDefault(); handleNext(); }} className="space-y-5">
        
        {/* STEP 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Nom complet</label>
              <input 
                required 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Prof. Jean Dupont" 
                className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-zinc-900 dark:text-white" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Adresse Email</label>
              <input 
                required 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="vous@exemple.com" 
                className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-zinc-900 dark:text-white" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Mot de passe</label>
              <input 
                required 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-zinc-900 dark:text-white" 
              />
            </div>
          </div>
        )}

        {/* STEP 2: Academy Name, Thematic & Subscription Plan */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Nom de votre Académie</label>
              <input 
                required 
                type="text" 
                value={academyName} 
                onChange={e => setAcademyName(e.target.value)} 
                placeholder="Ex: Blockchain Business School" 
                className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-zinc-900 dark:text-white" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Thématique principale</label>
              <select 
                value={thematic}
                onChange={e => setThematic(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-zinc-950 dark:text-white"
              >
                <option value="blockchain">Blockchain & Smart Contracts</option>
                <option value="trading">Trading & Finance Décentralisée</option>
                <option value="ai">Intelligence Artificielle</option>
                <option value="web3">Développement Web3 (Full-stack)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Sélectionnez votre forfait de démarrage</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "FREE", name: "Free", price: "0$" },
                  { id: "PRO", name: "Pro", price: "49$" },
                  { id: "MAX", name: "Max", price: "200$" }
                ].map((plan) => (
                  <div 
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id as "FREE" | "PRO" | "MAX")}
                    className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center transition-all ${
                      selectedPlan === plan.id 
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600" 
                        : "border-zinc-200 dark:border-zinc-800 hover:border-blue-300 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    <span className="font-bold text-sm">{plan.name}</span>
                    <span className="text-xs mt-1">{plan.price}/m</span>
                    {selectedPlan === plan.id && <CheckCircle2 className="w-4 h-4 text-blue-600 mt-2" />}
                  </div>
                ))}
              </div>
              <p className="text-zinc-400 text-xs mt-2 text-center">Aucune carte bancaire requise. Vous pourrez modifier votre abonnement ou payer plus tard.</p>
            </div>
          </div>
        )}
        
        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <button 
              type="button" 
              onClick={handlePrev}
              className="px-4 py-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <button 
            type="submit"
            className="flex-1 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
          >
            {step === 2 ? "Finaliser et Accéder à mon Espace" : "Suivant"}
            {step < 2 && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </form>

      {step === 1 && (
        <div className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Vous avez déjà un compte ?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-500 font-semibold">
            Se connecter
          </Link>
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <Suspense fallback={<div>Chargement...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
