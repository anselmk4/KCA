"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { AlertCircle, ArrowRight, Loader2, Sparkles, BookOpen, ShieldCheck, Cpu, Coins } from "lucide-react";
import { initDB } from "@/lib/db";
import { loginWithEmail, fetchUserProfile } from "@/lib/supabase/auth-helpers";
import { supabase } from "@/lib/supabase/client";
import { setSimulatedSession } from "@/lib/rbac";
import { Captcha } from "@/components/ui/Captcha";
import { useLanguage } from "@/context/LanguageContext";

function LoginForm() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";
  const registeredEmail = searchParams.get("email") || "";
  const roleParam = searchParams.get("role") || "STUDENT";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState<number>(0);

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
        console.error("Error checking active session on login page load:", err);
      }
    };
    checkSession();
  }, [router]);

  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setTimeout(() => {
        setLockoutTime(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutTime]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime > 0) {
      setError(`Trop de tentatives. Veuillez patienter ${lockoutTime} secondes.`);
      return;
    }
    setError(null);

    if (!captchaToken) {
      setError("Veuillez valider le test de sécurité (CAPTCHA).");
      return;
    }

    setLoading(true);
    try {
      // Server-side security check (CAPTCHA verification + Rate Limiting)
      const secRes = await fetch("/api/auth/security-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: captchaToken, action: "login" })
      });

      if (!secRes.ok) {
        const secData = await secRes.json();
        throw new Error(secData.error || "La vérification de sécurité a échoué.");
      }

      const { redirectTo } = await loginWithEmail(email, password);
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
      setLoading(false);
      setCaptchaResetKey(prev => prev + 1); // Reset Captcha on error
      setFailedAttempts(prev => {
        const next = prev + 1;
        if (next >= 5) {
          setLockoutTime(60);
          setError("Trop de tentatives infructueuses. Formulaire verrouillé pour 60 secondes.");
          return 0;
        }
        return next;
      });
    }
  };

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const reasonParam = searchParams.get("reason");
    if (errorParam || reasonParam) {
      setError(reasonParam ? `Erreur d'authentification : ${reasonParam}` : "L'authentification Google a échoué. Veuillez réessayer.");
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const { error: authErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/confirmed`,
        },
      });
      if (authErr) throw authErr;
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue avec Google Auth.");
      setGoogleLoading(false);
    }
  };

  const quickLogin = async (testEmail: string, testPassword: string) => {
    if (lockoutTime > 0) {
      setError(`Trop de tentatives. Veuillez patienter ${lockoutTime} secondes.`);
      return;
    }
    setError(null);
    setLoading(true);
    setEmail(testEmail);
    setPassword(testPassword);
    try {
      const { redirectTo } = await loginWithEmail(testEmail, testPassword);
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
      setLoading(false);
      setFailedAttempts(prev => {
        const next = prev + 1;
        if (next >= 5) {
          setLockoutTime(60);
          setError("Trop de tentatives infructueuses. Formulaire verrouillé pour 60 secondes.");
          return 0;
        }
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-black font-sans">

      {/* LEFT PANEL: Marketing & Slogan (hidden on mobile) */}
      <div className="hidden lg:flex lg:col-span-6 relative overflow-hidden bg-gradient-to-br from-slate-100 via-teal-50/50 to-blue-50/70 dark:from-zinc-900 dark:via-zinc-950 dark:to-black p-12 flex-col justify-between select-none border-r border-zinc-200 dark:border-zinc-850">
        {/* Abstract Glowing shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 dark:bg-blue-600/5 rounded-full blur-[120px] -mr-40 -mt-40 animate-pulse duration-[6000ms]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-[120px] -ml-40 -mb-40 animate-pulse duration-[8000ms]" />

        {/* Header Branding */}
        <div className="z-10 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="ANSELLA Logo" width={160} height={48} className="object-contain h-10 w-auto dark:hidden" priority />
            <Image src="/logo-dark.png" alt="ANSELLA Logo" width={160} height={48} className="object-contain h-10 w-auto hidden dark:block" priority />
          </Link>
          <Link href="/" className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors font-medium">
            ← Accueil
          </Link>
        </div>

        {/* Catchy advertisement and logo representation */}
        <div className="z-10 max-w-md my-auto space-y-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-200/50 dark:bg-white/5 backdrop-blur-md border border-zinc-300/40 dark:border-white/10 rounded-full text-zinc-700 dark:text-zinc-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>LMS Premium de Nouvelle Génération</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
              Gagnez de l'argent {" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500 dark:from-blue-400 dark:via-teal-400 dark:to-emerald-400">
                en faisant ce que vous aimez
              </span>
            </h1>
            <p className="text-zinc-650 dark:text-zinc-400 text-base leading-relaxed font-medium">
              Formez-vous avec les meilleurs experts mondiaux. Débloquez des parcours certifiants, passez des quiz d'évaluation et obtenez des certificats officiels et vérifiables en ligne.
            </p>
          </div>

          {/* Core Features list with visual feedback */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-sm text-zinc-700 dark:text-zinc-350 font-semibold">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Coins className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span>Formations de niveau professionnel</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-zinc-700 dark:text-zinc-350 font-semibold">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span>Outils et agents d'Intelligence Artificielle appliqués</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-zinc-700 dark:text-zinc-350 font-semibold">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <span>Certificats d'études officiels et vérifiables</span>
            </div>
          </div>
        </div>

        {/* Footer Brand Info */}
        <div className="z-10 text-xs text-zinc-450 dark:text-zinc-500">
          © {new Date().getFullYear()} Ansella Inc. Tous droits réservés.
        </div>
      </div>

      {/* RIGHT PANEL: Login Form */}
      <div className="lg:col-span-6 flex items-center justify-center p-6 md:p-12 bg-zinc-50 dark:bg-zinc-950">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200/80 dark:border-white/10 p-5 sm:p-8 md:p-10 relative overflow-hidden transition-all">

          {/* Top Brand representing mobile view logo */}
          <div className="flex flex-col items-center mb-8">
            <Link href="/" className="flex items-center mb-6">
              <Image src="/logo.png" alt="ANSELLA Logo" width={140} height={42} className="object-contain h-9 w-auto lg:hidden dark:hidden" priority />
              <Image src="/logo-dark.png" alt="ANSELLA Logo" width={140} height={42} className="object-contain h-9 w-auto lg:hidden hidden dark:block" priority />
            </Link>
            <div className="w-full flex justify-end mb-4 lg:hidden">
              <Link href="/" className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors font-medium">
                {language === "en" ? "← Back to Home" : "← Retour à l'accueil"}
              </Link>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
              {language === "en" ? "Welcome to Ansella" : "Bienvenue sur Ansella"}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-center text-sm">
              {language === "en" 
                ? "Log in to your academy or learner space." 
                : "Connectez-vous à votre académie ou à votre espace apprenant."}
            </p>
          </div>

          {registered && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/30 rounded-2xl flex items-start gap-3 text-emerald-800 dark:text-emerald-400 text-xs animate-in fade-in">
              <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div className="space-y-1">
                <p className="font-extrabold uppercase tracking-wider text-[10px]">
                  {language === "en" ? "Registration successful!" : "Inscription réussie !"}
                </p>
                <p className="leading-relaxed font-semibold">
                  {language === "en" 
                    ? `A confirmation email has been sent to ` 
                    : `Un e-mail de confirmation a été envoyé à `}
                  <span className="underline font-bold text-zinc-800 dark:text-zinc-200">{registeredEmail}</span>.
                </p>
                <p className="text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400 font-medium">
                  {language === "en" 
                    ? `Please click the link in the email to activate your ${roleParam === "INSTRUCTOR" ? "Instructor" : "Learner"} account before logging in.`
                    : `Veuillez cliquer sur le lien dans l'e-mail pour activer votre compte ${roleParam === "INSTRUCTOR" ? "Formateur" : "Apprenant"} avant de vous connecter.`}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex items-start gap-3 text-red-700 dark:text-red-400 text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                {language === "en" ? "Email Address" : "Adresse Email"}
              </label>
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
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  {language === "en" ? "Password" : "Mot de passe"}
                </label>
                <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-500 font-medium">
                  {language === "en" ? "Forgot password?" : "Mot de passe oublié ?"}
                </Link>
              </div>
              <input
                required
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-zinc-900 dark:text-white"
              />
            </div>

            <div className="py-2">
              <Captcha onVerify={setCaptchaToken} resetKey={captchaResetKey} />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading || !captchaToken}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer text-sm"
            >
              {loading ? (
                language === "en" ? <><Loader2 className="w-4 h-4 animate-spin" /> Logging in...</> : <><Loader2 className="w-4 h-4 animate-spin" /> Connexion en cours...</>
              ) : (
                language === "en" ? <>Log In <ArrowRight className="w-4 h-4" /></> : <>Se connecter <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-zinc-250 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-400 dark:text-zinc-500 font-bold">
                {language === "en" ? "Or continue with" : "Ou continuer avec"}
              </span>
            </div>
          </div>

          {/* Google Login button */}
          <button
            type="button"
            disabled={loading || googleLoading}
            onClick={handleGoogleLogin}
            className="w-full py-3 px-4 bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 cursor-pointer text-sm"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span>{language === "en" ? "Sign in with Google" : "Se connecter avec Google"}</span>
          </button>

          {/* Quick test accounts — affiché uniquement si NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true */}
          {process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === 'true' && (
            <div className="mt-8 pt-6 border-t border-zinc-150 dark:border-zinc-800">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 text-center">
                {language === "en" ? "Quick demo access" : "Accès rapide démo"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={loading || googleLoading}
                  onClick={() => quickLogin("instructor@kuettu.com", "password123")}
                  className="py-2.5 px-3 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-350 transition-all text-left disabled:opacity-50 cursor-pointer"
                >
                  <p className="font-bold text-zinc-900 dark:text-white">Prof. Kuettu</p>
                  <p className="text-[10px] text-zinc-505">{language === "en" ? "Instructor" : "Formateur"}</p>
                </button>
                <button
                  type="button"
                  disabled={loading || googleLoading}
                  onClick={() => quickLogin("jean@example.com", "password123")}
                  className="py-2.5 px-3 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-350 transition-all text-left disabled:opacity-50 cursor-pointer"
                >
                  <p className="font-bold text-zinc-900 dark:text-white">Jean Dupont</p>
                  <p className="text-[10px] text-zinc-505">{language === "en" ? "Learner" : "Apprenant"}</p>
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 text-center text-sm text-zinc-650 dark:text-zinc-400">
            {language === "en" ? "New to the platform?" : "Nouveau sur la plateforme ?"}{" "}
            <Link href="/register" className="text-blue-600 hover:text-blue-500 font-bold transition-colors">
              {language === "en" ? "Create an account" : "Créer un compte"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
