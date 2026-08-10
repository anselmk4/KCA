"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { getSimulatedSession } from "@/lib/rbac";
import { OnboardingTour } from "@/components/layout/OnboardingTour";
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
    const s = getSimulatedSession();
    if (!s) {
      router.replace("/login");
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
      <OnboardingTour />
      <Chatbot />
    </div>
  );
}
