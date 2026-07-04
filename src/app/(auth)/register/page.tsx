"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowRight, ArrowLeft, CheckCircle2, BookOpen, Sparkles, User, ShieldCheck, Cpu, Coins, Loader2 } from "lucide-react";
import { initDB } from "@/lib/db";
import { setSimulatedSession } from "@/lib/rbac";
import { supabase } from "@/lib/supabase/client";
import { ensureProfile, fetchUserProfile } from "@/lib/supabase/auth-helpers";

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
  const [bio, setBio] = useState<string>("");

  // Student specific fields
  const [studentLevel, setStudentLevel] = useState<string>("Débutant");
  const [interestCourse, setInterestCourse] = useState<string>("blockchain");

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    initDB();
    
    const checkSession = async () => {
      try {
        const { data: { session: activeSession } } = await supabase.auth.getSession();
        if (activeSession?.user) {
          const profile = await fetchUserProfile(activeSession.user.id);
          if (profile) {
            setSimulatedSession({
              userId: profile.id,
              name: profile.full_name,
              email: profile.email,
              role: profile.role,
              status: profile.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
              plan: profile.plan,
            });

            if (profile.role === 'INSTRUCTOR' || profile.role === 'TEACHING_ASSISTANT') {
              router.replace('/instructor');
            } else if (
              profile.role === 'SUPER_ADMIN' ||
              profile.role === 'ADMIN' ||
              profile.role === 'FINANCE_ADMIN' ||
              profile.role === 'ACADEMIC_ADMIN' ||
              profile.role === 'SUPPORT_AGENT'
            ) {
              router.replace('/admin');
            } else {
              router.replace('/dashboard');
            }
          }
        }
      } catch (err) {
        console.error("Error checking active session on register page load:", err);
      }
    };
    checkSession();
    
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
  }, [searchParams, router]);

  const handleNext = () => {
    setFormError(null);
    setSuccessMessage(null);
    if (step === 1) {
      if (!name.trim()) { setFormError("Le nom complet est requis."); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setFormError("Adresse email invalide."); return; }
      if (password.length < 8) { setFormError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    }
    setStep(step + 1);
  };
  
  const handlePrev = () => {
    setFormError(null);
    setSuccessMessage(null);
    if (step === 1) {
      setRole(null); // Go back to role selection
    } else {
      setStep(step - 1);
    }
  };

  const handleGoogleRegister = async () => {
    setFormError(null);
    setGoogleLoading(true);
    try {
      const { error: authErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (authErr) throw authErr;
    } catch (err: any) {
      setFormError(err.message || "Une erreur est survenue lors de l'authentification Google.");
      setGoogleLoading(false);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { 
            full_name: name,
            role: role || "STUDENT",
            academy_name: academyName || null,
            bio: bio || null,
            student_level: studentLevel || null,
            interest_course: interestCourse || null
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/auth/confirmed`,
        }
      });

      if (authError) {
        const msg = authError.message.toLowerCase();
        if (msg.includes("already registered") || msg.includes("user already exists") || msg.includes("duplicate")) {
          setFormError("Cet email est déjà utilisé. Essayez de vous connecter.");
        } else if (msg.includes("database error saving new user")) {
          setFormError("Erreur lors de la création. Cet email est peut-être déjà utilisé.");
        } else if (msg.includes("password")) {
          setFormError("Mot de passe trop faible. Minimum 8 caractères.");
        } else if (msg.includes("invalid email") || msg.includes("unable to validate email")) {
          setFormError("Adresse email invalide.");
        } else if (msg.includes("email rate limit") || msg.includes("rate limit")) {
          setFormError("Trop de tentatives. Attendez quelques minutes et réessayez.");
        } else {
          setFormError(authError.message);
        }
        setLoading(false);
        return;
      }

      const sessionUser = authData.user;
      if (!sessionUser) {
        setFormError("Erreur lors de l'inscription. Réessayez.");
        setLoading(false);
        return;
      }

      // Check if session is immediately active (email confirmations disabled in Supabase)
      const hasActiveSession = !!authData.session;

      if (hasActiveSession) {
        // Email auto-confirmed — set up profile and redirect immediately
        await ensureProfile(sessionUser.id, email, name, role || "STUDENT");

        if (role === "INSTRUCTOR") {
          await supabase.from("profiles").update({
            plan: "FREE",
            academy_name: academyName || "Mon Académie",
            bio: bio,
          }).eq("id", sessionUser.id);

          setSimulatedSession({
            userId: sessionUser.id,
            name,
            email,
            role: "INSTRUCTOR",
            status: "ACTIVE",
            plan: "FREE",
          });

          localStorage.setItem("kuettu_academy_name", academyName || "Mon Académie");
          localStorage.setItem("kuettu_user_name", name);

          router.push("/instructor");
        } else {
          // STUDENT
          const levelMap: Record<string, "BEGINNER" | "INTERMEDIATE" | "ADVANCED"> = {
            "Débutant": "BEGINNER",
            "Intermédiaire": "INTERMEDIATE",
            "Avancé": "ADVANCED",
          };
          await supabase.from("profiles").update({
            level: levelMap[studentLevel] || "BEGINNER",
          }).eq("id", sessionUser.id);

          setSimulatedSession({
            userId: sessionUser.id,
            name,
            email,
            role: "STUDENT",
            status: "ACTIVE",
            plan: "FREE",
          });

          localStorage.setItem("kuettu_user_name", name);
          localStorage.setItem("kuettu_user_level", studentLevel);
          localStorage.setItem("kuettu_active_module", interestCourse);

          // Auto-enroll in chosen course
          const COURSE_MAP: Record<string, string> = {
            blockchain: "10000000-0000-0000-0000-000000000001",
            trading: "10000000-0000-0000-0000-000000000002",
            ai: "10000000-0000-0000-0000-000000000003",
            web3: "10000000-0000-0000-0000-000000000004",
          };
          const courseId = COURSE_MAP[interestCourse] || interestCourse;

          const { error: enrollError } = await supabase.from("enrollments").upsert({
            student_id: sessionUser.id,
            course_id: courseId,
            progress_percent: 0,
            status: "ACTIVE",
            enrolled_at: new Date().toISOString(),
          }, { onConflict: "student_id,course_id", ignoreDuplicates: true });

          if (enrollError) {
            console.error("Auto-enrollment error during registration:", enrollError.message);
          }

          router.push("/dashboard");
        }
      } else {
        // Email confirmation required — show success message, do NOT redirect
        // The /auth/callback route will handle profile creation after email click
        setSuccessMessage(
          "Inscription réussie ! Un email de confirmation a été envoyé à " + email + ". Vérifiez votre boîte mail (et vos spams) puis cliquez sur le lien pour activer votre compte."
        );
      }
    } catch (err: any) {
      setFormError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-white/10 p-8 md:p-10 relative overflow-hidden transition-all duration-300">
      
      {/* Progress Bar */}
      {role !== null && (
        <div className="absolute top-0 left-0 w-full h-1.5 bg-zinc-100 dark:bg-zinc-800">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col items-center mb-8 mt-2">
        <Link href="/" className="lg:hidden flex items-center mb-4">
          <Image src="/logo.png" alt="ANSELLA Logo" width={140} height={42} className="object-contain h-9 w-auto" priority />
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 text-center leading-snug">
          {role === null && "Choisissez votre profil"}
          {role === "INSTRUCTOR" && step === 1 && "Créer un compte Formateur"}
          {role === "INSTRUCTOR" && step === 2 && "Configurez votre Académie"}
          {role === "STUDENT" && step === 1 && "Créer un compte Apprenant"}
          {role === "STUDENT" && step === 2 && "Configurez vos préférences"}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-center text-xs leading-relaxed max-w-sm">
          {role === null && "Sélectionnez la manière dont vous souhaitez utiliser notre LMS."}
          {role === "INSTRUCTOR" && step === 1 && "Lancer et monétisez votre école en ligne en quelques clics."}
          {role === "INSTRUCTOR" && step === 2 && "Configurez vos préférences et confirmez votre forfait."}
          {role === "STUDENT" && step === 1 && "Accédez aux meilleures formations certifiantes de haut niveau."}
          {role === "STUDENT" && step === 2 && "Dites-nous en plus sur vos objectifs pour personnaliser votre espace."}
        </p>
      </div>

      {role === null ? (
        /* STEP 0: Role Selection */
        <div className="space-y-4 animate-in fade-in duration-300">
          <div 
            onClick={() => setRole("STUDENT")}
            className="group p-5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-blue-500 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-blue-50/10 dark:hover:bg-blue-900/5 cursor-pointer transition-all flex items-start gap-4"
          >
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 group-hover:scale-105 transition-transform shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-base group-hover:text-blue-650 dark:group-hover:text-blue-400 transition-colors">
                Je suis un Apprenant
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Je souhaite suivre des cours interactifs, passer des examens et obtenir des certifications professionnelles.
              </p>
            </div>
          </div>

          <div 
            onClick={() => setRole("INSTRUCTOR")}
            className="group p-5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-blue-500 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-blue-50/10 dark:hover:bg-blue-900/5 cursor-pointer transition-all flex items-start gap-4"
          >
            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20 text-purple-600 group-hover:scale-105 transition-transform shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-base group-hover:text-purple-650 dark:group-hover:text-purple-400 transition-colors">
                Je suis un Formateur / Enseignant
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Je souhaite créer ma propre académie en ligne, héberger mes formations et les vendre à l'aide de paiements locaux.
              </p>
            </div>
          </div>

          <div className="pt-4 text-center text-sm text-zinc-650 dark:text-zinc-400">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-500 font-bold transition-colors">
              Se connecter
            </Link>
          </div>
        </div>
      ) : (
        /* STEP 1 & 2: Form Content */
        <form onSubmit={step === 2 ? handleComplete : (e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
          
          {formError && (
            <div className="px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs text-red-700 dark:text-red-400 font-semibold rounded-xl animate-in fade-in">
              {formError}
            </div>
          )}

          {successMessage && (
            <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-xs text-emerald-700 dark:text-emerald-400 font-semibold rounded-xl animate-in fade-in flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}
          
          {/* STEP 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Nom complet</label>
                <input 
                  required 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder={role === "INSTRUCTOR" ? "Prof. Jean Dupont" : "Jean Dupont"} 
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-zinc-900 dark:text-white" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Adresse Email</label>
                <input 
                  required 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="vous@exemple.com" 
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-zinc-900 dark:text-white" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Mot de passe</label>
                <input 
                  required 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={8}
                  placeholder="•••••••• (Min. 8 caractères)" 
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-zinc-900 dark:text-white" 
                />
              </div>

              {/* Google signup inside step 1 */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-400 font-bold">Ou utiliser</span>
                </div>
              </div>

              <button
                type="button"
                disabled={loading || googleLoading}
                onClick={handleGoogleRegister}
                className="w-full py-3 px-4 bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 cursor-pointer text-xs"
              >
                {googleLoading ? (
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                ) : (
                  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15.01 1 12 1 7.21 1 3.19 3.78 1.28 7.82l3.86 3C6.07 7.78 8.81 5.04 12 5.04z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.92c2.2-2.03 3.67-5.02 3.67-8.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.14 14.82c-.25-.74-.39-1.53-.39-2.35s.14-1.61.39-2.35L1.28 7.12C.46 8.78 0 10.63 0 12.5s.46 3.72 1.28 5.38l3.86-3.06z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.92c-1.04.7-2.38 1.12-3.83 1.12-3.19 0-5.93-2.74-6.86-5.78l-3.86 3C3.19 20.22 7.21 23 12 23z"
                    />
                  </svg>
                )}
                <span>S'inscrire avec Google (Profil Apprenant)</span>
              </button>
            </div>
          )}

          {/* STEP 2: Configuration (Role-Specific) */}
          {step === 2 && role === "INSTRUCTOR" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Nom de votre Académie</label>
                <input 
                  required 
                  type="text" 
                  value={academyName} 
                  onChange={e => setAcademyName(e.target.value)} 
                  placeholder="Ex: École de Commerce de Kinshasa" 
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-zinc-900 dark:text-white" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Petite description / Bio</label>
                <textarea 
                  required 
                  value={bio} 
                  onChange={e => setBio(e.target.value)} 
                  placeholder="Décrivez votre expérience ou votre académie..." 
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-zinc-900 dark:text-white resize-none" 
                />
              </div>
            </div>
          )}

          {step === 2 && role === "STUDENT" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Votre niveau actuel</label>
                <select 
                  value={studentLevel}
                  onChange={e => setStudentLevel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-zinc-950 dark:text-white"
                >
                  <option value="Débutant">Débutant (Je découvre)</option>
                  <option value="Intermédiaire">Intermédiaire (J'ai quelques notions)</option>
                  <option value="Avancé">Avancé (Je souhaite me spécialiser)</option>
                </select>
              </div>
              
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xxs text-blue-800 dark:text-blue-300 leading-relaxed font-semibold">
                  L'inscription vous donne un accès immédiat aux chapitres d'évaluation du cours choisi. Vous pourrez à tout moment débloquer l'accès complet et obtenir votre certificat vérifiable.
                </p>
              </div>
            </div>
          )}
          
          {/* Stepper Buttons */}
          <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button 
              type="button" 
              onClick={handlePrev}
              disabled={loading}
              className="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button 
              type="submit"
              disabled={loading || googleLoading}
              className="flex-1 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer text-sm"
            >
              {loading ? "Création du compte..." : (step === 2 ? "Finaliser et ouvrir mon Espace" : "Suivant")}
              {!loading && step < 2 && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-black font-sans">
      
      {/* LEFT PANEL: Marketing & Slogan (hidden on mobile) */}
      <div className="hidden lg:flex lg:col-span-6 relative overflow-hidden bg-gradient-to-br from-slate-100 via-teal-50/50 to-blue-50/70 dark:from-zinc-900 dark:via-zinc-950 dark:to-black p-12 flex-col justify-between select-none border-r border-zinc-200 dark:border-zinc-850">
        {/* Abstract Glowing shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 dark:bg-blue-600/5 rounded-full blur-[120px] -mr-40 -mt-40 animate-pulse duration-[6000ms]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-[120px] -ml-40 -mb-40 animate-pulse duration-[8000ms]" />
        
        {/* Header Branding */}
        <div className="z-10 flex items-center">
          <Image src="/logo.png" alt="ANSELLA Logo" width={160} height={48} className="object-contain h-10 w-auto" priority />
        </div>

        {/* Catchy advertisement and logo representation */}
        <div className="z-10 max-w-md my-auto space-y-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-200/50 dark:bg-white/5 backdrop-blur-md border border-zinc-300/40 dark:border-white/10 rounded-full text-zinc-700 dark:text-zinc-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>LMS Premium de Nouvelle Génération</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
              Développez vos compétences avec{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500 dark:from-blue-400 dark:via-teal-400 dark:to-emerald-400">
                Ansella
              </span>
            </h1>
            <p className="text-zinc-650 dark:text-zinc-400 text-base leading-relaxed font-medium">
              Créez votre profil en quelques secondes pour acquérir des compétences concrètes et valorisables sur le marché.
            </p>
          </div>

          {/* Features check list */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-sm text-zinc-700 dark:text-zinc-350 font-semibold">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Coins className="w-4 h-4 text-blue-600 dark:text-blue-450" />
              </div>
              <span>Accès gratuit aux cours d'évaluation</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-zinc-700 dark:text-zinc-350 font-semibold">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-450" />
              </div>
              <span>Quiz d'évaluation et de progression</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-zinc-700 dark:text-zinc-350 font-semibold">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-450" />
              </div>
              <span>Diplômes et certifications infalsifiables</span>
            </div>
          </div>
        </div>

        {/* Footer Brand Info */}
        <div className="z-10 text-xs text-zinc-450 dark:text-zinc-500">
          © {new Date().getFullYear()} Ansella Inc. Tous droits réservés.
        </div>
      </div>

      {/* RIGHT PANEL: Registration Form Container */}
      <div className="lg:col-span-6 flex items-center justify-center p-6 md:p-12 bg-zinc-50 dark:bg-zinc-950">
        <Suspense fallback={<div className="text-zinc-500 dark:text-zinc-400 text-sm">Chargement...</div>}>
          <RegisterForm />
        </Suspense>
      </div>

    </div>
  );
}
