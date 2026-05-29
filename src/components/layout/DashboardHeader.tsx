"use client";

import { Search, Bell, ChevronDown, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useEffect, useState } from "react";
import { getSimulatedSession } from "@/lib/rbac";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    setSession(getSimulatedSession());
    const handler = () => setSession(getSimulatedSession());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

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
        {/* Search — hidden on small screens */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            className="pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-48 lg:w-64 transition-all"
          />
        </div>

        <div className="flex items-center space-x-3">
          <ThemeToggle />

          <button className="relative p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full hover:bg-zinc-50 text-zinc-600 dark:text-zinc-300">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-zinc-800" />
          </button>
          
          <div className="flex items-center space-x-2 cursor-pointer pl-2 border-l border-zinc-200 dark:border-zinc-700">
            <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
              {initials}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-none">{session?.name?.split(" ")[0] || "Étudiant"}</p>
              <p className="text-xs text-zinc-500 mt-1">Plan {session?.plan || "FREE"}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-zinc-500 hidden md:block" />
          </div>
        </div>
      </div>
    </header>
  );
}
