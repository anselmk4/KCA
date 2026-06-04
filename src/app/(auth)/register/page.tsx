"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, ArrowRight, ArrowLeft, CheckCircle2, BookOpen, Sparkles, User, ShieldCheck } from "lucide-react";
import { addUser, getDB, saveDB, initDB } from "@/lib/db";
import { setSimulatedSession } from "@/lib/rbac";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Registration Role: null = Selection, "STUDENT" = Learner, "INSTRUCTOR" = Teacher
  const [role, setRole] = useState<"INSTRUCTOR" | "STUDENT" | null>(null);
  const [step, setStep] = useState(1); // 1 = Personal Info, 2 = Configuration
  
  // Form fields
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  
  // Instructor specific fields
  const [academyName, setAcademyName] = useState<string>("");
  const [thematic, setThematic] = useState<string>("blockchain");
  const [selectedPlan, setSelectedPlan] = useState<"FREE" | "BASE" | "PRO" | "MAX">("FREE");

  // Student specific fields
  const [studentLevel, setStudentLevel] = useState<string>("Débutant");
  const [interestCourse, setInterestCourse] = useState<string>("blockchain");

  useEffect(() => {
    initDB();
    
    // Read query params for smart role pre-selection
    const queryPlan = searchParams.get("plan")?.toUpperCase();
    const queryModule = searchParams.get("module")?.toLowerCase();
    const queryRole = searchParams.get("role")?.toUpperCase();

    if (queryPlan === "FREE" || queryPlan === "BASE" || queryPlan === "PRO" || queryPlan === "MAX") {
      setSelectedPlan(queryPlan as "FREE" | "BASE" | "PRO" | "MAX");
      setRole("INSTRUCTOR");
    } else if (queryModule === "blockchain" || queryModule === "trading" || queryModule === "ai" || queryModule === "web3") {
      setInterestCourse(queryModule);
      setRole("STUDENT");
    } else if (queryRole === "INSTRUCTOR" || queryRole === "TEACHER") {
      setRole("INSTRUCTOR");
    } else if (queryRole === "STUDENT" || queryRole === "LEARNER" || queryRole === "APPRENANT") {
      setRole("STUDENT");
    }
  }, [searchParams]);

  const [formError, setFormError] = useState<string | null>(null);

  const handleNext = () => {
    setFormError(null);
    if (step === 1) {
      if (!name.trim()) { setFormError("Le nom complet est requis."); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setFormError("Adresse email invalide."); return; }
      if (password.length < 8) { setFormError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    }
    setStep(step + 1);
  };
  const handlePrev = () => {
    if (step === 1) {
      setRole(null); // Go back to role selection
    } else {
      setStep(step - 1);
    }
  };

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (role === "INSTRUCTOR") {
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
      localStorage.setItem("kuettu_user_name", name || "Ansel Instructeur");
      
      // Redirect to the instructor area
      router.push("/instructor");
    } else {
      // Create new student user in the local database
      const newUser = addUser({
        name: name || "Ansel Apprenant",
        email: email || "student@example.com",
        role: "STUDENT",
        plan: "FREE",
        level: studentLevel,
        activeCourse: interestCourse
      });

      // Update simulated session to login as this student
      setSimulatedSession({
        userId: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: "STUDENT",
        status: "ACTIVE",
        plan: "FREE"
      });

      // Store student info in localStorage for display consistency
      localStorage.setItem("kuettu_user_name", name || "Ansel Apprenant");
      localStorage.setItem("kuettu_user_level", studentLevel);
      localStorage.setItem("kuettu_active_module", interestCourse);

      // Auto-enroll the student in their chosen course
      const db = getDB();
      const existingEnrollment = db.enrollments.find(
        (e) => e.studentId === newUser.id && e.courseId === interestCourse
      );
      if (!existingEnrollment) {
        db.enrollments.push({
          id: `e${Date.now()}`,
          studentId: newUser.id,
          courseId: interestCourse,
          progressPercent: 0,
          joinedAt: new Date().toISOString()
        });
        saveDB(db);
      }
      
      // Redirect to the student dashboard
      router.push("/dashboard");
    }
  };

  return (
    <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-white/10 p-8 relative overflow-hidden transition-all duration-300">
      
      {/* Progress Bar */}
      {role !== null && (
        <div className="absolute top-0 left-0 w-full h-1 bg-zinc-100 dark:bg-zinc-800">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>
      )}

      <div className="flex flex-col items-center mb-8 mt-4">
        <Link href="/" className="flex items-center space-x-2 mb-4">
          <GraduationCap className="h-10 w-10 text-blue-600" />
          <span className="font-bold text-2xl text-zinc-900 dark:text-white">Kuettu Pro</span>
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 text-center">
          {role === null && "Choisissez votre profil"}
          {role === "INSTRUCTOR" && step === 1 && "Créer un compte Formateur"}
          {role === "INSTRUCTOR" && step === 2 && "Configurez votre Académie"}
          {role === "STUDENT" && step === 1 && "Créer un compte Apprenant"}
          {role === "STUDENT" && step === 2 && "Configurez vos préférences"}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-center text-sm">
          {role === null && "Sélectionnez comment vous souhaitez utiliser la plateforme."}
          {role === "INSTRUCTOR" && step === 1 && "Lancer et monétisez votre école en ligne en quelques clics."}
          {role === "INSTRUCTOR" && step === 2 && "Choisissez votre thématique et confirmez votre forfait."}
          {role === "STUDENT" && step === 1 && "Accédez aux meilleures formations certifiantes sur le Web3 et l'IA."}
          {role === "STUDENT" && step === 2 && "Dites-nous en plus sur vos objectifs pour personnaliser votre tableau de bord."}
        </p>
      </div>

      {role === null ? (
        /* STEP 0: Role Selection */
        <div className="space-y-4 animate-in fade-in duration-300">
          <div 
            onClick={() => setRole("STUDENT")}
            className="group p-6 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-blue-500 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-blue-50/10 dark:hover:bg-blue-900/5 cursor-pointer transition-all flex items-start gap-4"
          >
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Je suis un Apprenant
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Je souhaite suivre des cours interactifs de haut niveau, passer des examens et obtenir des certifications blockchain.
              </p>
            </div>
          </div>

          <div 
            onClick={() => setRole("INSTRUCTOR")}
            className="group p-6 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-blue-500 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-blue-50/10 dark:hover:bg-blue-900/5 cursor-pointer transition-all flex items-start gap-4"
          >
            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20 text-purple-600 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-lg group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Je suis un Formateur / Enseignant
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Je souhaite créer ma propre académie en ligne, héberger mes formations et les vendre à l'aide de paiements locaux.
              </p>
            </div>
          </div>

          <div className="pt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-500 font-semibold">
              Se connecter
            </Link>
          </div>
        </div>
      ) : (
        /* STEP 1 & 2: Form Content */
        <form onSubmit={step === 2 ? handleComplete : (e) => { e.preventDefault(); handleNext(); }} className="space-y-5">
          {/* Validation error banner */}
          {formError && (
            <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-sm text-red-700 dark:text-red-400 font-medium">
              {formError}
            </div>
          )}
          
          {/* STEP 1: Personal Info (Both Roles) */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Nom complet</label>
                <input 
                  required 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder={role === "INSTRUCTOR" ? "Prof. Jean Dupont" : "Jean Dupont"} 
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
                  minLength={8}
                  placeholder="••••••••" 
                  className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-zinc-900 dark:text-white" 
                />
              </div>
            </div>
          )}

          {/* STEP 2: Configuration (Role-Specific) */}
          {step === 2 && role === "INSTRUCTOR" && (
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
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "FREE", name: "Free", price: "0$" },
                    { id: "BASE", name: "Base", price: "19$" },
                    { id: "PRO", name: "Pro", price: "49$" },
                    { id: "MAX", name: "Max", price: "200$" }
                  ].map((plan) => (
                    <div 
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id as "FREE" | "BASE" | "PRO" | "MAX")}
                      className={`p-2.5 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center transition-all ${
                        selectedPlan === plan.id 
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-bold" 
                          : "border-zinc-200 dark:border-zinc-800 hover:border-blue-300 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                      }`}
                    >
                      <span className="text-xs font-semibold">{plan.name}</span>
                      <span className="text-[10px] mt-1">{plan.price}/m</span>
                      {selectedPlan === plan.id && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-1.5" />}
                    </div>
                  ))}
                </div>
                <p className="text-zinc-400 text-xs mt-2 text-center">Aucune carte bancaire requise. Vous pourrez modifier votre abonnement ou payer plus tard.</p>
              </div>
            </div>
          )}

          {step === 2 && role === "STUDENT" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Votre niveau actuel</label>
                <select 
                  value={studentLevel}
                  onChange={e => setStudentLevel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-zinc-950 dark:text-white"
                >
                  <option value="Débutant">Débutant (Je découvre)</option>
                  <option value="Intermédiaire">Intermédiaire (J'ai quelques notions)</option>
                  <option value="Avancé">Avancé (Je souhaite me spécialiser)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Cours d'intérêt principal</label>
                <select 
                  value={interestCourse}
                  onChange={e => setInterestCourse(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-zinc-950 dark:text-white"
                >
                  <option value="blockchain">Fondamentaux de la Blockchain</option>
                  <option value="trading">Crypto-monnaie & Trading</option>
                  <option value="ai">Intelligence Artificielle & Automatisation</option>
                  <option value="web3">Développement Web3 complet</option>
                </select>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  L'inscription vous donne un accès immédiat à la version d'évaluation gratuite du cours choisi. Vous pourrez à tout moment débloquer l'accès complet et obtenir votre certificat vérifiable sur la blockchain.
                </p>
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={handlePrev}
              className="px-4 py-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button 
              type="submit"
              className="flex-1 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
            >
              {step === 2 ? "Finaliser et Accéder à mon Espace" : "Suivant"}
              {step < 2 && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </form>
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
