"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { getSimulatedSession, setSimulatedSession } from "@/lib/rbac";
import { fetchUserProfile } from "@/lib/supabase/auth-helpers";
import { OnboardingTour } from "@/components/layout/OnboardingTour";
import { CompleteProfileModal } from "@/components/auth/CompleteProfileModal";
import Chatbot from "@/components/Chatbot";
import { AlertTriangle, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let s = getSimulatedSession();
    if (!s) {
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (user) {
          const profile = await fetchUserProfile(user.id);
          const role = profile?.role || (user.user_metadata?.role as any) || "STUDENT";
          if (role !== "STUDENT") {
            if (role === "INSTRUCTOR" || role === "TEACHING_ASSISTANT") {
              router.replace("/instructor");
            } else {
              router.replace("/admin");
            }
            return;
          }
          const restored = {
            userId: user.id,
            name: profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Étudiant",
            email: user.email || "",
            role: role as any,
            status: "ACTIVE" as const,
            plan: (profile?.plan as any) || "FREE",
          };
          setSimulatedSession(restored);
          setAuthorized(true);
          if (typeof window !== "undefined") {
            setUnconfirmed(localStorage.getItem("kuettu_unconfirmed_email") === "true");
          }
        } else {
          router.replace("/login");
        }
      });
      return;
    }
    if (s.role !== "STUDENT") {
      if (s.role === "INSTRUCTOR" || s.role === "TEACHING_ASSISTANT") {
        router.replace("/instructor");
      } else {
        router.replace("/admin");
      }
      return;
    }
    setAuthorized(true);
    if (typeof window !== "undefined") {
      setUnconfirmed(localStorage.getItem("kuettu_unconfirmed_email") === "true");
    }

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email_verified")
          .eq("id", user.id)
          .maybeSingle();

        if (user.email_confirmed_at || profile?.email_verified) {
          setUnconfirmed(false);
          if (typeof window !== "undefined") {
            localStorage.removeItem("kuettu_unconfirmed_email");
          }
        }
      }
    });
  }, [router]);

  if (!authorized) {
    return null; // Don't flash layout while checking role and redirecting
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content Wrapper */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        {unconfirmed && (
          <div className="bg-amber-500 text-white px-6 py-3.5 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300 shrink-0">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 animate-bounce" />
              <p className="text-xs md:text-sm font-semibold">
                <strong>Action requise :</strong> Veuillez vérifier vos e-mails et activer votre compte sous un délai de <strong>2 jours</strong>. Passé ce délai, votre compte et vos données seront supprimés.
              </p>
            </div>
            <button
              onClick={() => setUnconfirmed(false)}
              className="text-white hover:text-amber-100 p-1 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
      <CompleteProfileModal />
      <OnboardingTour />
      <Chatbot />
    </div>
  );
}
