"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, Sparkles, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { fetchUserProfile } from "@/lib/supabase/auth-helpers";
import { setSimulatedSession } from "@/lib/rbac";

/**
 * Fixes role assignments using the authenticated user's own session.
 * Works without SUPABASE_SERVICE_ROLE_KEY because RLS allows
 * authenticated users to manage their own user_roles rows.
 */
async function fixRoleForAuthenticatedUser(userId: string, intendedRole: string): Promise<void> {
  try {
    const role = intendedRole.toUpperCase();

    // Only fix if not STUDENT (STUDENT is the default auto-assigned role)
    if (role === "STUDENT") return;

    // 1. Get the target role row
    const { data: targetRoleRow, error: targetErr } = await supabase
      .from("roles")
      .select("id")
      .eq("name", role as any)
      .single();

    if (targetErr || !targetRoleRow) {
      console.error("[confirmed] target role not found:", role, targetErr?.message);
      return;
    }

    // 2. Get the STUDENT role row
    const { data: studentRoleRow } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "STUDENT" as any)
      .single();

    // 3. Remove STUDENT role — authenticated user can delete their own roles (RLS: auth.uid() = user_id)
    if (studentRoleRow) {
      const { error: delErr } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role_id", studentRoleRow.id);

      if (delErr) {
        console.error("[confirmed] failed to remove STUDENT role:", delErr.message);
      } else {
        console.log("[confirmed] STUDENT role removed for user", userId);
      }
    }

    // 4. Assign the correct role — authenticated user can insert their own roles (RLS: auth.uid() = user_id)
    const { error: insertErr } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role_id: targetRoleRow.id }, { onConflict: "user_id,role_id", ignoreDuplicates: true });

    if (insertErr) {
      console.error("[confirmed] failed to assign role:", role, insertErr.message);
    } else {
      console.log("[confirmed] Role", role, "assigned to user", userId);
    }
  } catch (err) {
    console.error("[confirmed] fixRole error:", err);
  }
}

function resolveRedirect(role: string): { href: string; label: string } {
  const r = role.toUpperCase();
  if (["SUPER_ADMIN", "ADMIN", "FINANCE_ADMIN", "ACADEMIC_ADMIN", "SUPPORT_AGENT"].includes(r)) {
    return { href: "/admin", label: "Accéder au Panneau Admin" };
  } else if (r === "INSTRUCTOR" || r === "TEACHING_ASSISTANT") {
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
  const [statusText, setStatusText] = useState("Préparation de votre espace...");

  useEffect(() => {
    async function run() {
      try {
        // --- Step 1: get authenticated session (set by /auth/callback via cookies) ---
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          // No session: fall back to the role URL param passed by the server callback
          const roleParam = searchParams.get("role") || "STUDENT";
          const { href, label } = resolveRedirect(roleParam);
          setDashboardHref(href);
          setDashboardLabel(label);
          return;
        }

        const user = session.user;

        // --- Step 2: read the role the user INTENDED to register with ---
        // This was stored in user_metadata at signUp() and is always trustworthy.
        const intendedRole = ((user.user_metadata?.role as string) || "STUDENT").toUpperCase();
        console.log("[confirmed] intendedRole from user_metadata:", intendedRole);

        // --- Step 3: fix roles in DB using the authenticated session (no service key needed) ---
        if (intendedRole !== "STUDENT") {
          setStatusText("Activation de votre rôle...");
          await fixRoleForAuthenticatedUser(user.id, intendedRole);
        }

        // --- Step 4: fetch fresh profile after role fix ---
        setStatusText("Chargement de votre profil...");
        const profile = await fetchUserProfile(user.id);

        let finalRole = intendedRole; // trust user_metadata as ground truth

        if (profile) {
          // If profile.role now matches intendedRole → great
          // If still STUDENT but intendedRole !== STUDENT → the fix may take a moment; use intendedRole
          finalRole = (profile.role === "STUDENT" && intendedRole !== "STUDENT")
            ? intendedRole
            : profile.role;

          setSimulatedSession({
            userId: profile.id,
            name: profile.full_name,
            email: profile.email,
            role: finalRole as "STUDENT" | "INSTRUCTOR" | "TEACHING_ASSISTANT" | "ADMIN" | "SUPER_ADMIN" | "FINANCE_ADMIN" | "ACADEMIC_ADMIN" | "SUPPORT_AGENT",
            status: profile.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
            plan: profile.plan,
          });
        }

        const { href, label } = resolveRedirect(finalRole);
        setDashboardHref(href);
        setDashboardLabel(label);
      } catch (err) {
        console.error("[confirmed] bootstrap error:", err);
        // Fallback: use server-resolved role param
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

  // Auto-redirect countdown once loading is done and we have a valid destination
  useEffect(() => {
    if (loading || dashboardHref === "/login") return;

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
  }, [loading, dashboardHref, router]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950 font-sans relative overflow-hidden">
      {/* Abstract Glowing shapes */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 dark:bg-blue-600/5 rounded-full blur-[120px] -mr-40 -mt-40 animate-pulse duration-[6000ms] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-[120px] -ml-40 -mb-40 animate-pulse duration-[8000ms] pointer-events-none" />

      {/* Header */}
      <header className="z-10 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <Link href="/">
          <Image src="/logo.png" alt="ANSELLA Logo" width={140} height={42} className="object-contain h-9 w-auto" priority />
        </Link>
        <Link href="/" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
          ← Retour à l&apos;accueil
        </Link>
      </header>

      {/* Main card */}
      <main className="z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200/80 dark:border-white/10 p-8 md:p-10 relative overflow-hidden transition-all duration-300 flex flex-col items-center text-center">

          {/* Success Badge */}
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
          ) : (
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
          )}

          <div className="mt-6 flex items-center gap-2 text-xxs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Plateforme Sécurisée ANSELLA</span>
          </div>

        </div>
      </main>

      {/* Footer */}
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
