"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  Users,
  Video,
  BarChart3,
  Wallet,
  MessageSquare,
  Settings,
  LogOut,
  CreditCard,
  Menu,
  X,
  ChevronDown,
  User,
  Lock,
  Bell,
  UserCircle,
  Users2,
  Ticket,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getSimulatedSession, setSimulatedSession, clearSimulatedSession } from "@/lib/rbac";
import { supabase } from "@/lib/supabase/client";
import { OnboardingTour } from "@/components/layout/OnboardingTour";
import Chatbot from "@/components/Chatbot";

const menuItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/instructor" },
  { icon: BookOpen, label: "Mes cours", href: "/instructor/courses" },
  { icon: Ticket, label: "Codes promo / Coupons", href: "/instructor/coupons" },
  { icon: Users, label: "Étudiants", href: "/instructor/students" },
  { icon: Video, label: "Sessions live", href: "/instructor/live" },
  { icon: BarChart3, label: "Analytique", href: "/instructor/analytics" },
  { icon: Wallet, label: "Revenus", href: "/instructor/earnings" },
  { icon: CreditCard, label: "Abonnement", href: "/instructor/billing" },
  { icon: MessageSquare, label: "Messages", href: "/instructor/messages" },
  { icon: Users2, label: "Communauté", href: "/instructor/community" },
  { icon: Settings, label: "Paramètres", href: "/instructor/settings" },
];

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [academyName, setAcademyName] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = getSimulatedSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    if (s.role !== "INSTRUCTOR" && s.role !== "TEACHING_ASSISTANT") {
      const isAdmin = ["SUPER_ADMIN", "ADMIN", "FINANCE_ADMIN", "ACADEMIC_ADMIN", "SUPPORT_AGENT"].includes(s.role);
      router.replace(isAdmin ? "/admin" : "/dashboard");
      return;
    }
    setSession(s);

    // Fetch academy name and plan from Supabase profile
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("academy_name, full_name, plan")
          .eq("id", user.id)
          .single();
        if (profile?.academy_name) {
          setAcademyName(profile.academy_name);
        } else if (profile?.full_name) {
          setAcademyName(`Académie de ${profile.full_name}`);
        } else {
          setAcademyName("Mon Académie");
        }
        if (profile?.plan) {
          setSession((prev: any) => prev ? { ...prev, plan: profile.plan } : { plan: profile.plan });
        }
      }
    });

    const handleStorage = () => {
      setSession(getSimulatedSession());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [router]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = (href: string) => {
    if (href === "/instructor") return pathname === "/instructor";
    return pathname.startsWith(href);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMsg({ type: "error", text: "Les mots de passe ne correspondent pas." });
      return;
    }
    if (passwordForm.next.length < 6) {
      setPasswordMsg({ type: "error", text: "Le mot de passe doit contenir au moins 6 caractères." });
      return;
    }
    setPasswordMsg({ type: "success", text: "Mot de passe mis à jour avec succès !" });
    setPasswordForm({ current: "", next: "", confirm: "" });
    setTimeout(() => { setPasswordMsg(null); setShowPasswordModal(false); }, 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearSimulatedSession();
    window.location.href = "/login";
  };

  const initials = session?.name
    ? session.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "PK";

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
      <aside className={`w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 h-screen flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-100 dark:border-zinc-800">
          <Link href="/instructor" className="flex items-center" onClick={() => setSidebarOpen(false)}>
            <Image src="/logo.png" alt="ANSELLA" width={100} height={30} className="object-contain h-7 w-auto" />
            <span className="font-bold text-xs text-zinc-400 dark:text-zinc-500 border-l border-zinc-200 dark:border-zinc-700 pl-2 ml-2 leading-none">Instructeur</span>
          </Link>
          <button className="lg:hidden p-1 text-zinc-500" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 py-6 px-4 flex flex-col gap-1 overflow-y-auto">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const isLocked = (
              item.href === "/instructor/live" ||
              item.href === "/instructor/coupons" ||
              item.href === "/instructor/community"
            ) && session?.plan === "FREE";

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  active
                    ? "bg-teal-50 dark:bg-teal-900/20 text-teal-600 font-semibold"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm">{item.label}</span>
                </div>
                {isLocked && (
                  <Lock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                )}
              </Link>
            );
          })}
          {userId && (
            <Link
              href={`/profile/${userId}`}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                pathname === `/profile/${userId}`
                  ? "bg-teal-50 dark:bg-teal-900/20 text-teal-600 font-semibold"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <UserCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">Mon Profil</span>
            </Link>
          )}
        </div>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-zinc-900 flex items-center justify-between px-4 md:px-8 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Hamburger */}
            <button
              className="lg:hidden p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-teal-600 hidden sm:block">Espace Instructeur</span>
            {academyName && (
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hidden md:inline border-l border-zinc-200 dark:border-zinc-700 pl-3">
                {academyName}
              </span>
            )}
            {session?.plan && (
              <span className={`text-[10px] tracking-wider font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                session.plan === "MAX"
                  ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50"
                  : session.plan === "PRO"
                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50"
                  : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
              }`}>
                Plan {session.plan}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Notifications */}
            <button className="relative p-2 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-zinc-900" />
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-700"
              >
                <div className="w-9 h-9 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-sm">
                  {initials}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white leading-none">{session?.name || "Instructeur"}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{session?.email || ""}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 font-bold">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{session?.name}</p>
                        <p className="text-xs text-zinc-400">{session?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <Link
                      href="/instructor/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <User className="w-4 h-4 text-zinc-400" />
                      Mon Profil & Académie
                    </Link>
                    {userId && (
                      <Link
                        href={`/profile/${userId}`}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <UserCircle className="w-4 h-4 text-zinc-400" />
                        Voir mon profil public
                      </Link>
                    )}
                    <button
                      onClick={() => { setProfileOpen(false); setShowPasswordModal(true); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Lock className="w-4 h-4 text-zinc-400" />
                      Changer le mot de passe
                    </button>
                    <Link
                      href="/instructor/billing"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-zinc-400" />
                      Mon Abonnement
                      <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        session?.plan === "MAX" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        : session?.plan === "PRO" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}>{session?.plan || "FREE"}</span>
                    </Link>
                  </div>
                  <div className="border-t border-zinc-100 dark:border-zinc-800 py-2">
                    <button
                      onClick={() => { setProfileOpen(false); handleLogout(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Changer le mot de passe</h2>
              <button onClick={() => setShowPasswordModal(false)} className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordMsg && (
              <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${
                passwordMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                  : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
              }`}>
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              {[
                { label: "Mot de passe actuel", key: "current" },
                { label: "Nouveau mot de passe", key: "next" },
                { label: "Confirmer le nouveau mot de passe", key: "confirm" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{label}</label>
                  <input
                    required
                    type="password"
                    value={passwordForm[key as keyof typeof passwordForm]}
                    onChange={e => setPasswordForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border-transparent focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  />
                </div>
              ))}
              <button
                type="submit"
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-colors"
              >
                Mettre à jour le mot de passe
              </button>
            </form>
          </div>
        </div>
      )}
      <OnboardingTour />
      <Chatbot />
    </div>
  );
}
