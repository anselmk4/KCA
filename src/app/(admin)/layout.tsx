"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Users2, CreditCard, LogOut, ShieldAlert,
  LifeBuoy, BookOpen, Coins, Settings, Ticket, Activity, Menu, X,
  Mail, ChevronRight, Shield,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  getSimulatedSession, getAdminSidebarItems, ADMIN_ROLES,
  ROLE_META, CurrentSession, Permission, Role,
  hasPermission
} from "@/lib/rbac";

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-5 h-5" />,
  Users2:          <Users2 className="w-5 h-5" />,
  Users:           <Users className="w-5 h-5" />,
  BookOpen:        <BookOpen className="w-5 h-5" />,
  CreditCard:      <CreditCard className="w-5 h-5" />,
  Coins:           <Coins className="w-5 h-5" />,
  Ticket:          <Ticket className="w-5 h-5" />,
  LifeBuoy:        <LifeBuoy className="w-5 h-5" />,
  Mail:            <Mail className="w-5 h-5" />,
  Activity:        <Activity className="w-5 h-5" />,
  Settings:        <Settings className="w-5 h-5" />,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<CurrentSession | null>(null);

  const loadSession = useCallback(() => {
    const s = getSimulatedSession();
    if (!s) { router.replace("/login"); return; }
    if (!ADMIN_ROLES.includes(s.role as Role)) {
      const isInstructor = ["INSTRUCTOR", "TEACHING_ASSISTANT"].includes(s.role);
      router.replace(isInstructor ? "/instructor" : "/dashboard");
      return;
    }
    setSession(s);
  }, [router]);

  useEffect(() => {
    loadSession();
    window.addEventListener("storage", loadSession);
    return () => window.removeEventListener("storage", loadSession);
  }, [loadSession]);

  if (!session) return null;

  const roleMeta = ROLE_META[session.role] || ROLE_META.SUPPORT_AGENT;
  const menuItems = getAdminSidebarItems(
    session.role as Role,
    session.grantedPermissions || [],
    session.revokedPermissions || []
  );

  // Initials for avatar
  const initials = session.name
    .split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0b] flex font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800
        h-screen flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>

        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base text-zinc-900 dark:text-white tracking-tight">
              Admin Panel
            </span>
          </Link>
          <button
            className="lg:hidden p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${roleMeta.color}`}>
            <Shield className="w-3 h-3" />
            {roleMeta.label}
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                  active
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <span className={active ? "text-red-500" : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"}>
                  {ICON_MAP[item.icon]}
                </span>
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 text-red-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user card */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-1 shrink-0">
          {/* User card */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials || "AD"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{session.name}</p>
              <p className="text-[10px] text-zinc-400 truncate">{session.email}</p>
            </div>
          </div>

          <Link
            href="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-500 dark:text-zinc-400
              hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all text-sm"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Espace Étudiant</span>
          </Link>

          <button
            onClick={async () => {
              const { supabase } = await import("@/lib/supabase/client");
              const { clearSimulatedSession } = await import("@/lib/rbac");
              await supabase.auth.signOut();
              clearSimulatedSession();
              window.location.href = "/login";
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500
              hover:bg-red-50 dark:hover:bg-red-900/10 transition-all text-sm font-medium cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="h-14 bg-white dark:bg-zinc-900 flex items-center justify-between
          px-4 md:px-6 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                Mode Administrateur
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${roleMeta.color}`}>
              {roleMeta.label}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
