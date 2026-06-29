"use client";

import { Bell, ChevronDown, Menu, Settings, LogOut, UserCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useEffect, useState, useRef } from "react";
import { getSimulatedSession } from "@/lib/rbac";
import Link from "next/link";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
  role?: "student" | "instructor";
}

export function DashboardHeader({ onMenuClick, role = "student" }: DashboardHeaderProps) {
  const [session, setSession] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSession(getSimulatedSession());
    const handler = () => setSession(getSimulatedSession());
    window.addEventListener("storage", handler);

    const syncSession = async () => {
      try {
        const { supabase } = await import("@/lib/supabase/client");
        const { fetchUserProfile } = await import("@/lib/supabase/auth-helpers");
        const { setSimulatedSession: setSimSession } = await import("@/lib/rbac");
        const { data: { session: activeSession } } = await supabase.auth.getSession();
        
        if (activeSession?.user) {
          setUserId(activeSession.user.id);
          const localSession = getSimulatedSession();
          if (!localSession || localSession.userId !== activeSession.user.id) {
            const profile = await fetchUserProfile(activeSession.user.id);
            if (profile) {
              setSimSession({
                userId: profile.id,
                name: profile.full_name,
                email: profile.email,
                role: profile.role,
                status: profile.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
                plan: profile.plan,
              });
              setSession(getSimulatedSession());
            }
          }
        }
      } catch (err) {
        console.error("Error in DashboardHeader syncSession:", err);
      }
    };
    syncSession();

    const clickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);

    return () => {
      window.removeEventListener("storage", handler);
      document.removeEventListener("mousedown", clickOutside);
    };
  }, []);

  const handleLogout = async () => {
    const { supabase } = await import("@/lib/supabase/client");
    const { clearSimulatedSession } = await import("@/lib/rbac");
    await supabase.auth.signOut();
    clearSimulatedSession();
    window.location.href = "/login";
  };

  const initials = session?.name
    ? session.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "AN";

  return (
    <header className="h-16 bg-white dark:bg-zinc-900 flex items-center justify-between px-4 md:px-8 border-b border-zinc-200 dark:border-white/10 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center text-sm text-zinc-500 dark:text-zinc-400">
          <span>Dashboard</span>
          <span className="mx-2">›</span>
          <span className="text-zinc-900 dark:text-zinc-100 font-medium">Vue d'ensemble</span>
        </div>
      </div>

      <div className="flex items-center space-x-3 md:space-x-6">
        <div className="flex items-center space-x-3">
          <ThemeToggle />

          <button className="relative p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full hover:bg-zinc-50 text-zinc-600 dark:text-zinc-300">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-zinc-800" />
          </button>
          
          <div ref={dropdownRef} className="relative">
            <div 
              onClick={() => setDropdownOpen(!dropdownOpen)} 
              className="flex items-center space-x-2 cursor-pointer pl-2 border-l border-zinc-200 dark:border-zinc-700 select-none"
            >
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                {initials}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-none">{session?.name?.split(" ")?.[0] || "Étudiant"}</p>
                <p className="text-xs text-zinc-500 mt-1">Plan {session?.plan || "FREE"}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-zinc-500 hidden md:block" />
            </div>

            {dropdownOpen && (
              <div className="absolute right-0 top-12 w-56 bg-white dark:bg-zinc-850 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{session?.name || "Étudiant"}</p>
                  <p className="text-xxs text-zinc-400 truncate">{session?.email || "etudiant@example.com"}</p>
                  <p className="text-xxs text-blue-600 dark:text-blue-400 font-bold mt-1">Plan {session?.plan || "FREE"}</p>
                </div>
                <Link href="/dashboard/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <Settings className="w-4 h-4 text-zinc-400" />
                  <span>Paramètres</span>
                </Link>
                {userId && (
                  <Link href={`/dashboard/profile/${userId}`} onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <UserCircle className="w-4 h-4 text-zinc-400" />
                    <span>Mon Profil</span>
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors text-left border-t border-zinc-100 dark:border-zinc-800 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
