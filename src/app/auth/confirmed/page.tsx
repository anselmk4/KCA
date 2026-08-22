"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, Sparkles, ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { fetchUserProfile } from "@/lib/supabase/auth-helpers";
import { setSimulatedSession, getSimulatedSession } from "@/lib/rbac";
import type { Session } from "@supabase/supabase-js";

/**
 * Wait for a Supabase session to be available client-side.
 * The server-side callback sets the session via cookies; the client SDK
 * may need a moment to read them. We wait up to 6s via onAuthStateChange.
 */
async function waitForSession(): Promise<Session | null> {
  // Fast path: session already available
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;

  // Slow path: wait for the auth state change event (cookie propagation delay)
  return new Promise<Session | null>((resolve) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s) {
        subscription.unsubscribe();
        resolve(s);
      }
    });
    // Timeout after 6s to avoid hanging forever
    setTimeout(() => {
      subscription.unsubscribe();
      resolve(null);
    }, 6000);
  });
}

/**
 * Fix role assignments using the authenticated user's own session.
 * Strictly limited to INSTRUCTOR / TEACHING_ASSISTANT registrations.
 * Admin roles can NEVER be assigned via this client function.
 */
async function fixRoleForAuthenticatedUser(userId: string, intendedRole: string): Promise<void> {
  try {
    const role = intendedRole.toUpperCase();
    if (role !== "INSTRUCTOR" && role !== "TEACHING_ASSISTANT") return;

    const { data: targetRoleRow, error: targetErr } = await supabase
      .from("roles")
      .select("id")
      .eq("name", role as any)
      .single();

    if (targetErr || !targetRoleRow) {
      console.error("[confirmed] target role not found:", role, targetErr?.message);
      return;
    }

    const { data: studentRoleRow } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "STUDENT" as any)
      .single();

    if (studentRoleRow) {
      const { error: delErr } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role_id", studentRoleRow.id);
      if (delErr) console.error("[confirmed] failed to remove STUDENT role:", delErr.message);
      else console.log("[confirmed] STUDENT role removed for user", userId);
    }

    const { error: insertErr } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role_id: targetRoleRow.id }, { onConflict: "user_id,role_id", ignoreDuplicates: true });

    if (insertErr) console.error("[confirmed] failed to assign role:", role, insertErr.message);
    else console.log("[confirmed] Role", role, "assigned to user", userId);
  } catch (err) {
    console.error("[confirmed] fixRole error:", err);
  }
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

  useEffect(() => {
    async function run() {
      try {
        // 1. Check for error in hash fragment or query params
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

        // 2. Role lookup from URL or registration tracking (never trust old localStorage session)
        const savedRegRole = typeof window !== "undefined" ? localStorage.getItem("kuettu_registration_role") : null;
        const roleParam = (searchParams.get("role") || savedRegRole || "STUDENT").toUpperCase();
        const safeRegistrationRole = (roleParam === "INSTRUCTOR" || roleParam === "TEACHING_ASSISTANT") ? roleParam : "STUDENT";

        setStatusText("Vérification de votre session...");

        // Client-side fallback: if PKCE code is in searchParams, attempt client exchange
        const codeParam = searchParams.get("code");
        if (codeParam) {
          try {
            await supabase.auth.exchangeCodeForSession(codeParam);
          } catch (codeErr) {
            console.warn("[confirmed] client code exchange fallback info:", codeErr);
          }
        }

        // Always wait for the session to be fully established client-side.
        const session = await waitForSession();

        if (session?.user) {
          setHasSession(true);
          const user = session.user;
          const intendedRole = (
            (user.user_metadata?.role as string) ||
            safeRegistrationRole
          ).toUpperCase();

          const sanitizedRole = (intendedRole === "INSTRUCTOR" || intendedRole === "TEACHING_ASSISTANT") ? intendedRole : "STUDENT";

          // Fix roles only for Instructor registrations
          if (sanitizedRole === "INSTRUCTOR" || sanitizedRole === "TEACHING_ASSISTANT") {
            setStatusText("Activation de votre rôle Formateur...");
            await fixRoleForAuthenticatedUser(user.id, sanitizedRole);
          }

          setStatusText("Chargement de votre profil...");
          const profile = await fetchUserProfile(user.id);

          // Update profile status in database to ACTIVE
          try {
            await supabase
              .from('profiles')
              .update({ status: 'ACTIVE' })
              .eq('id', user.id);
          } catch (stErr) {
            console.warn("[confirmed] Could not update profile status to ACTIVE:", stErr);
          }

          let finalRole = profile?.role || sanitizedRole;

          // Extra security: if user has SUPER_ADMIN but is not authorized owner, demote to INSTRUCTOR/STUDENT
          const { isAuthorizedSuperAdmin } = await import("@/lib/rbac");
          if (finalRole === "SUPER_ADMIN" && !isAuthorizedSuperAdmin(user.email)) {
            finalRole = sanitizedRole;
          }

          if (typeof window !== "undefined") {
            localStorage.removeItem("kuettu_registration_role");
          }

          setSimulatedSession({
            userId: profile?.id || user.id,
            name: profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Utilisateur",
            email: profile?.email || user.email || "",
            role: finalRole as any,
            status: "ACTIVE",
            plan: profile?.plan || "FREE",
          });
          localStorage.setItem("kuettu_unconfirmed_email", "false");
          } else {
            setSimulatedSession({
              userId: user.id,
              name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Utilisateur",
              email: user.email || "",
              role: finalRole as any,
              status: "ACTIVE",
              plan: "FREE",
            });
            localStorage.setItem("kuettu_unconfirmed_email", "false");
          }

          const { href, label } = resolveRedirect(finalRole);
          setDashboardHref(href);
          setDashboardLabel(label);
        } else {
          setHasSession(false);
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

  // Auto-redirect countdown — only when we have a confirmed session
  useEffect(() => {
    if (loading || !hasSession || authError || dashboardHref === "/login") return;

    let seconds = 4;
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
  }, [loading, hasSession, authError, dashboardHref, router]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950 font-sans relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 dark:bg-blue-600/5 rounded-full blur-[120px] -mr-40 -mt-40 animate-pulse duration-[6000ms] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-[120px] -ml-40 -mb-40 animate-pulse duration-[8000ms] pointer-events-none" />

      <header className="z-10 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <Link href="/">
          <Image src="/logo.png" alt="ANSELLA Logo" width={140} height={42} className="object-contain h-9 w-auto dark:hidden" priority />
          <Image src="/logo-dark.png" alt="ANSELLA Logo" width={140} height={42} className="object-contain h-9 w-auto hidden dark:block" priority />
        </Link>
        <Link href="/" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
          ← Retour à l'accueil
        </Link>
      </header>

      <main className="z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200/80 dark:border-white/10 p-8 md:p-10 relative overflow-hidden transition-all duration-300 flex flex-col items-center text-center">

          {authError ? (
            <>
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 relative z-10">
                  <AlertTriangle className="w-10 h-10 stroke-[2]" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-700 dark:text-red-400 text-xs font-bold mb-4 uppercase tracking-wider">
                <span>Erreur d'authentification</span>
              </div>

              <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-3 tracking-tight">
                Connexion non finalisée
              </h1>

              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed max-w-sm">
                {authError.includes("server_error") 
                  ? "Une erreur serveur est survenue lors de la validation Google. Si votre compte a déjà été créé avec mot de passe, connectez-vous avec vos identifiants habituels."
                  : authError}
              </p>

              <Link
                href="/login"
                className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] duration-200 cursor-pointer text-sm"
              >
                <span>Retourner à la page de connexion</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <>
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md scale-110 animate-pulse" />
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 relative z-10">
                  <CheckCircle2 className="w-12 h-12 stroke-[2.5] animate-[bounce_1s_infinite_alternate]" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-4 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Compte vérifié avec succès</span>
              </div>

              <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-3 tracking-tight">
                Félicitations !
              </h1>

              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed max-w-sm">
                Votre compte est activé et prêt à être utilisé sur la plateforme ANSELLA.
              </p>

              {loading ? (
                <div className="w-full py-4 px-6 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span>{statusText}</span>
                </div>
              ) : hasSession ? (
                <div className="w-full space-y-3">
                  <div className="w-full py-3 px-6 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span>Redirection automatique dans <strong className="text-zinc-900 dark:text-white">{countdown}s</strong>…</span>
                  </div>
                  <Link
                    href={dashboardHref}
                    className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] duration-200 cursor-pointer text-sm"
                  >
                    <span>{dashboardLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <Link
                  href={dashboardHref}
                  className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] duration-200 cursor-pointer text-sm"
                >
                  <span>{dashboardLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </>
          )}

          <div className="mt-6 flex items-center gap-2 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Plateforme Sécurisée ANSELLA</span>
          </div>

        </div>
      </main>

      <footer className="z-10 w-full text-center py-6 text-xs text-zinc-450 dark:text-zinc-500">
        © {new Date().getFullYear()} Ansella Inc. Tous droits réservés.
      </footer>
    </div>
  );
}

export default function ConfirmedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    }>
      <ConfirmedContent />
    </Suspense>
  );
}
