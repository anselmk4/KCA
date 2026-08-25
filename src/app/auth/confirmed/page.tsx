"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  GraduationCap,
  Building2,
  BookOpen,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { fetchUserProfile } from "@/lib/supabase/auth-helpers";
import { setSimulatedSession } from "@/lib/rbac";
import type { Session } from "@supabase/supabase-js";

/**
 * Wait for a Supabase session to be available client-side.
 */
async function waitForSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;

  return new Promise<Session | null>((resolve) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s) {
        subscription.unsubscribe();
        resolve(s);
      }
    });
    setTimeout(() => {
      subscription.unsubscribe();
      resolve(null);
    }, 6000);
  });
}

function resolveRedirect(role: string): { href: string; label: string } {
  const r = (role || "STUDENT").toUpperCase();
  if (["SUPER_ADMIN", "ADMIN", "FINANCE_ADMIN", "ACADEMIC_ADMIN", "SUPPORT_AGENT"].includes(r)) {
    return { href: "/admin", label: "Accéder à l'Administration" };
  }
  if (r === "INSTRUCTOR" || r === "TEACHING_ASSISTANT") {
    return { href: "/instructor", label: "Accéder à mon Espace Formateur" };
  }
  return { href: "/dashboard", label: "Accéder à mon Espace Étudiant" };
}

function ConfirmedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dashboardHref, setDashboardHref] = useState("/login");
  const [dashboardLabel, setDashboardLabel] = useState("Se connecter");
  const [countdown, setCountdown] = useState(4);
  const [statusText, setStatusText] = useState("Vérification de votre session en cours...");
  const [hasSession, setHasSession] = useState(false);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);
  const [selectingRole, setSelectingRole] = useState(false);

  useEffect(() => {
    async function run() {
      try {
        if (typeof window !== "undefined") {
          const hash = window.location.hash.replace(/^#/, "");
          const urlParams = new URLSearchParams(hash || window.location.search);
          const errDesc = urlParams.get("error_description");
          const errCode = urlParams.get("error") || searchParams.get("error");

          if (errCode || errDesc) {
            const rawMsg = errDesc || errCode || "Échec d'authentification";
            const cleanMsg = decodeURIComponent(rawMsg.replace(/\+/g, " "));
            setAuthError(cleanMsg);
            setLoading(false);
            return;
          }
        }

        const needsRoleParam = searchParams.get("needsRole") === "true";
        const codeParam = searchParams.get("code");
        if (codeParam) {
          try {
            await supabase.auth.exchangeCodeForSession(codeParam);
          } catch (codeErr) {
            console.warn("[confirmed] client code exchange fallback info:", codeErr);
          }
        }

        const session = await waitForSession();

        if (session?.user) {
          setHasSession(true);
          const user = session.user;

          // Fetch user DB profile
          const profile = await fetchUserProfile(user.id);

          // Check if user has an existing role
          const { data: userRoles } = await supabase
            .from("user_roles")
            .select("roles(name)")
            .eq("user_id", user.id);

          const roleNames = (userRoles || []).map((ur: any) => ur.roles?.name).filter(Boolean);

          if (needsRoleParam || roleNames.length === 0 || (profile?.role as string) === "UNASSIGNED") {
            setNeedsRoleSelection(true);
            setLoading(false);
            return;
          }

          let finalRole = roleNames[0] || (profile?.role as string);
          if (!finalRole || finalRole === "UNASSIGNED") {
            setNeedsRoleSelection(true);
            setLoading(false);
            return;
          }

          setSimulatedSession({
            userId: profile?.id || user.id,
            name: profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Utilisateur",
            email: profile?.email || user.email || "",
            role: finalRole as any,
            status: "ACTIVE",
            plan: profile?.plan || "FREE",
          });

          const { href, label } = resolveRedirect(finalRole);
          setDashboardHref(href);
          setDashboardLabel(label);
        } else {
          setHasSession(false);
          const roleParam = searchParams.get("role") || "STUDENT";
          const { href, label } = resolveRedirect(roleParam);
          setDashboardHref(href);
          setDashboardLabel(label);
        }
      } catch (err: any) {
        console.error("[confirmed] bootstrap error:", err);
        const roleParam = searchParams.get("role") || "STUDENT";
        const { href, label } = resolveRedirect(roleParam);
        setDashboardHref(href);
        setDashboardLabel(label);
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [searchParams]);

  // Handle Role Choice for Google OAuth
  const handleSelectRole = async (chosenRole: "STUDENT" | "INSTRUCTOR") => {
    setSelectingRole(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/select-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: chosenRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la configuration du rôle.");
      }

      const { data: { user } } = await supabase.auth.getUser();

      setSimulatedSession({
        userId: user?.id || "",
        name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Utilisateur",
        email: user?.email || "",
        role: chosenRole,
        status: "ACTIVE",
        plan: "FREE",
      });

      router.replace(data.redirectTo || (chosenRole === "INSTRUCTOR" ? "/instructor" : "/dashboard"));
    } catch (err: any) {
      console.error("[handleSelectRole error]", err);
      setAuthError(err.message || "Erreur de sélection du rôle.");
      setSelectingRole(false);
    }
  };

  // Auto-redirect countdown
  useEffect(() => {
    if (loading || !hasSession || authError || needsRoleSelection || dashboardHref === "/login") return;

    let seconds = 3;
    setCountdown(seconds);

    const interval = setInterval(() => {
      seconds -= 1;
      setCountdown(seconds);
      if (seconds <= 0) {
        clearInterval(interval);
        router.replace(dashboardHref);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, hasSession, authError, needsRoleSelection, dashboardHref, router]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950 font-sans relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 dark:bg-blue-600/5 rounded-full blur-[120px] -mr-40 -mt-40 animate-pulse duration-[6000ms] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-[120px] -ml-40 -mb-40 animate-pulse duration-[8000ms] pointer-events-none" />

      <header className="z-10 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ANSELLA Logo" className="h-9 w-auto object-contain" />
        </Link>
        <Link href="/" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
          ← Retour à l&apos;accueil
        </Link>
      </header>

      <main className="z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200/80 dark:border-white/10 p-8 md:p-10 relative overflow-hidden transition-all duration-300 flex flex-col items-center text-center">

          {authError ? (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Erreur d&apos;authentification
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6 max-w-sm">
                {authError}
              </p>
              <Link
                href="/login"
                className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-semibold transition-all"
              >
                Retour à la page de connexion
              </Link>
            </>
          ) : loading ? (
            <div className="py-12 flex flex-col items-center space-y-4">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{statusText}</p>
            </div>
          ) : needsRoleSelection ? (
            /* ── Interactive Role Selection for Google OAuth Users ── */
            <div className="w-full space-y-6 text-left">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 text-xs font-bold border border-teal-200/60 dark:border-teal-800/60 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Bienvenue sur Ansella !</span>
                </div>
                <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  Choisissez votre Profil
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                  Pour vous orienter vers le bon tableau de bord, quel type de compte souhaitez-vous configurer ?
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {/* Option 1: Student */}
                <button
                  type="button"
                  disabled={selectingRole}
                  onClick={() => handleSelectRole("STUDENT")}
                  className="w-full p-4.5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700/80 hover:border-teal-500 dark:hover:border-teal-500 bg-zinc-50/50 dark:bg-zinc-800/40 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-all text-left group flex items-start gap-4 cursor-pointer disabled:opacity-50"
                >
                  <div className="w-11 h-11 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white group-hover:text-teal-600 transition-colors">
                        Apprenant / Étudiant
                      </h3>
                      <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      Je souhaite découvrir des cours, suivre mes leçons, passer des quiz et débloquer des certificats officiels.
                    </p>
                  </div>
                </button>

                {/* Option 2: Instructor */}
                <button
                  type="button"
                  disabled={selectingRole}
                  onClick={() => handleSelectRole("INSTRUCTOR")}
                  className="w-full p-4.5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700/80 hover:border-blue-500 dark:hover:border-blue-500 bg-zinc-50/50 dark:bg-zinc-800/40 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all text-left group flex items-start gap-4 cursor-pointer disabled:opacity-50"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        Formateur / Académie
                      </h3>
                      <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      Je souhaite créer mon académie, publier et vendre des formations, gérer mes étudiants et mes revenus.
                    </p>
                  </div>
                </button>
              </div>

              {selectingRole && (
                <div className="flex items-center justify-center gap-2 pt-2 text-xs font-bold text-teal-600 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Configuration de votre espace en cours...</span>
                </div>
              )}
            </div>
          ) : (
            /* ── Default Confirmed Countdown Screen ── */
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>

              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Compte confirmé avec succès !
              </h1>

              <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-8 max-w-sm leading-relaxed">
                Votre adresse email a été validée et votre compte est désormais actif sur Ansella.
              </p>

              <div className="w-full space-y-4">
                <Link
                  href={dashboardHref}
                  className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 group"
                >
                  <span>{dashboardLabel}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                  <span>Redirection automatique dans {countdown}s...</span>
                </div>
              </div>
            </>
          )}

        </div>
      </main>

      <footer className="z-10 py-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
        © {new Date().getFullYear()} Ansella. Plateforme d&apos;apprentissage &amp; Académies.
      </footer>
    </div>
  );
}

export default function ConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      }
    >
      <ConfirmedContent />
    </Suspense>
  );
}
