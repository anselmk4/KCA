"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, Sparkles, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { fetchUserProfile } from "@/lib/supabase/auth-helpers";
import { setSimulatedSession } from "@/lib/rbac";
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
 * Works without SUPABASE_SERVICE_ROLE_KEY because RLS allows
 * authenticated users to manage their own user_roles rows.
 */
async function fixRoleForAuthenticatedUser(userId: string, intendedRole: string): Promise<void> {
  try {
    const role = intendedRole.toUpperCase();
    if (role === "STUDENT") return;

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
    return { href: "/admin", label: "Accéder au Panneau Admin" };
  }
  if (r === "INSTRUCTOR" || r === "TEACHING_ASSISTANT") {
    return { href: "/instructor", label: "Accéder à mon Espace Formateur" };
  }
  return { href: "/dashboard", label: "Accéder à mon Espace Apprenant" };
}

function ConfirmedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [dashboardHref, setDashboardHref] = useState("/login");
  const [dashboardLabel, setDashboardLabel] = useState("Se connecter à mon Espace");
  const [countdown, setCountdown] = useState(4);
  const [statusText, setStatusText] = useState("Vérification de votre session...");
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    async function run() {
      try {
        // roleParam from URL — set by the server callback, reliable fallback
        const roleParam = (searchParams.get("role") || "STUDENT").toUpperCase();

        setStatusText("Vérification de votre session...");

        // Always wait for the session to be fully established client-side.
        // For students we skip fixRole, so without this wait the session
        // wouldn't be ready when the browser hits /dashboard (middleware blocks it).
        const session = await waitForSession();

        if (session?.user) {
          setHasSession(true);
          const user = session.user;
          const intendedRole = ((user.user_metadata?.role as string) || roleParam).toUpperCase();

          // Fix roles only for non-student registrations
          if (intendedRole !== "STUDENT") {
            setStatusText("Activation de votre rôle...");
            await fixRoleForAuthenticatedUser(user.id, intendedRole);
          }

          setStatusText("Chargement de votre profil...");
          const profile = await fetchUserProfile(user.id);

          let finalRole = intendedRole;
          if (profile) {
            // If DB still shows STUDENT but intended was not STUDENT → trust intendedRole
            finalRole =
              profile.role === "STUDENT" && intendedRole !== "STUDENT"
                ? intendedRole
                : profile.role;

            setSimulatedSession({
              userId: profile.id,
              name: profile.full_name,
              email: profile.email,
              role: finalRole as
                | "STUDENT"
                | "INSTRUCTOR"
                | "TEACHING_ASSISTANT"
                | "ADMIN"
                | "SUPER_ADMIN"
                | "FINANCE_ADMIN"
                | "ACADEMIC_ADMIN"
                | "SUPPORT_AGENT",
              status: profile.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
              plan: profile.plan,
            });
          }

          const { href, label } = resolveRedirect(finalRole);
          setDashboardHref(href);
          setDashboardLabel(label);
        } else {
          // Session timed out (very rare) — use URL param but do NOT auto-redirect
          // because the middleware would reject a sessionless request to /dashboard
          setHasSession(false);
          const { href, label } = resolveRedirect(roleParam);
          setDashboardHref(href);
          setDashboardLabel(label);
        }
      } catch (err) {
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
    if (loading || !hasSession || dashboardHref === "/login") return;

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
  }, [loading, hasSession, dashboardHref, router]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950 font-sans relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 dark:bg-blue-600/5 rounded-full blur-[120px] -mr-40 -mt-40 animate-pulse duration-[6000ms] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-[120px] -ml-40 -mb-40 animate-pulse duration-[8000ms] pointer-events-none" />

      <header className="z-10 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <Link href="/">
          <Image src="/logo.png" alt="ANSELLA Logo" width={140} height={42} className="object-contain h-9 w-auto" priority />
        </Link>
        <Link href="/" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
          ← Retour à l&apos;accueil
        </Link>
      </header>

      <main className="z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200/80 dark:border-white/10 p-8 md:p-10 relative overflow-hidden transition-all duration-300 flex flex-col items-center text-center">

          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md scale-110 animate-pulse" />
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 relative z-10">
              <CheckCircle2 className="w-12 h-12 stroke-[2.5] animate-[bounce_1s_infinite_alternate]" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-4 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Compte Validé avec succès</span>
          </div>

          <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-3 tracking-tight">
            Félicitations !
          </h1>

          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed max-w-sm">
            Votre adresse email a été vérifiée avec succès. Votre compte est maintenant activé et prêt à être utilisé sur la plateforme ANSELLA.
          </p>

          {loading ? (
            <div className="w-full py-4 px-6 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span>{statusText}</span>
            </div>
          ) : dashboardHref === "/login" ? (
            <Link
              href="/login"
              className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] duration-200 cursor-pointer text-sm"
            >
              <span>Se connecter à mon Espace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : hasSession ? (
            <div className="w-full space-y-3">
              <div className="w-full py-3 px-6 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span>Redirection dans <strong className="text-zinc-900 dark:text-white">{countdown}s</strong>…</span>
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
            // Session timed out — manual action required
            <Link
              href={dashboardHref}
              className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] duration-200 cursor-pointer text-sm"
            >
              <span>{dashboardLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <div className="mt-6 flex items-center gap-2 text-xxs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
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
