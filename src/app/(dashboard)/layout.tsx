"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { getSimulatedSession } from "@/lib/rbac";
import { OnboardingTour } from "@/components/layout/OnboardingTour";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
        
        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
      <OnboardingTour />
    </div>
  );
}
