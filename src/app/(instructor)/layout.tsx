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
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Trash2,
  Loader2,
  Share2,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getSimulatedSession, setSimulatedSession, clearSimulatedSession } from "@/lib/rbac";
import { getConversationsForUser } from "@/lib/chat";
import { supabase } from "@/lib/supabase/client";
import { OnboardingTour } from "@/components/layout/OnboardingTour";
import Chatbot from "@/components/Chatbot";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const { t, language } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const menuItems = [
    { icon: LayoutDashboard, label: t("instructor.sidebar.dashboard"), href: "/instructor" },
    { icon: BookOpen, label: t("instructor.sidebar.myCourses"), href: "/instructor/courses" },
    { icon: Ticket, label: language === "en" ? "Promo Codes / Coupons" : "Codes promo / Coupons", href: "/instructor/coupons" },
    { icon: Users, label: t("instructor.sidebar.students"), href: "/instructor/students" },
    { icon: Video, label: language === "en" ? "Live Sessions" : "Sessions live", href: "/instructor/live" },
    { icon: BarChart3, label: t("instructor.sidebar.analytics"), href: "/instructor/analytics" },
    { icon: Wallet, label: language === "en" ? "Revenue" : "Revenus", href: "/instructor/earnings" },
    { icon: Share2, label: language === "en" ? "Affiliation" : "Affiliation", href: "/instructor/affiliate" },
    { icon: CreditCard, label: t("instructor.sidebar.billing"), href: "/instructor/billing" },
    { icon: MessageSquare, label: language === "en" ? "Messages" : "Messages", href: "/instructor/messages" },
    { icon: Bell, label: t("instructor.sidebar.notifications"), href: "/instructor/notifications" },
    { icon: Users2, label: language === "en" ? "Community" : "Communauté", href: "/instructor/community" },
    { icon: Settings, label: t("instructor.sidebar.settings"), href: "/instructor/settings" },
  ];
  const [academyName, setAcademyName] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Messages State
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const messagesRef = useRef<HTMLDivElement>(null);

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, message, type, link, is_read, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!error && data) {
        setNotifications(data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error("Error marking notifications read:", err);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setNotificationsOpen(false);
      if (notif.link && notif.link !== "/" && notif.link !== "/instructor") {
        router.push(notif.link);
      } else {
        router.push("/instructor/notifications");
      }
    } catch (err) {
      console.error("Error clicking notification:", err);
    }
  };

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
    if (typeof window !== "undefined") {
      setUnconfirmed(localStorage.getItem("kuettu_unconfirmed_email") === "true");
    }

    // Fetch academy name, plan and notifications from Supabase profile
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        fetchNotifications(user.id);
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (messagesRef.current && !messagesRef.current.contains(e.target as Node)) {
        setMessagesOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadConversations = () => {
    const s = getSimulatedSession();
    if (s) {
      setConversations(getConversationsForUser(s.userId, s.role));
    }
  };

  // Keep conversations counts updated
  useEffect(() => {
    loadConversations();
    const handleStorageChange = () => loadConversations();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("kuettu_chat_update", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("kuettu_chat_update", handleStorageChange);
    };
  }, [session]);

  // Real-time notifications update subscription
  useEffect(() => {
    if (!userId) return;

    fetchNotifications(userId);

    const channel = supabase
      .channel(`realtime-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchNotifications(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

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
            <Image src="/logo.png" alt="ANSELLA" width={100} height={30} className="object-contain h-7 w-auto dark:hidden" />
            <Image src="/logo-dark.png" alt="ANSELLA" width={100} height={30} className="object-contain h-7 w-auto hidden dark:block" />
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
        <header className="h-16 bg-white dark:bg-zinc-900 flex items-center justify-between px-4 md:px-8 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
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
            <LanguageSwitcher />
            <ThemeToggle />

            {/* Messages Dropdown */}
            {session && (
              <div ref={messagesRef} className="relative">
                <button 
                  onClick={() => {
                    setMessagesOpen(!messagesOpen);
                    loadConversations();
                  }}
                  className="relative p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full hover:bg-zinc-50 text-zinc-600 dark:text-zinc-355 cursor-pointer flex items-center justify-center"
                >
                  <MessageSquare className="w-5 h-5 text-zinc-500" />
                  {conversations.filter(c => c.unreadCount > 0).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center border border-white dark:border-zinc-800 animate-pulse">
                      {conversations.filter(c => c.unreadCount > 0).length}
                    </span>
                  )}
                </button>

                {messagesOpen && (
                  <div className="absolute right-0 top-12 w-80 bg-white dark:bg-zinc-900 dark:border-zinc-800 rounded-xl border border-zinc-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">Messages</p>
                      <Link 
                        href="/instructor/messages"
                        onClick={() => setMessagesOpen(false)}
                        className="text-xxs text-teal-650 hover:text-teal-500 dark:text-teal-400 font-semibold cursor-pointer"
                      >
                        Ouvrir la messagerie
                      </Link>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                      {conversations.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-zinc-400">
                          Aucun message
                        </div>
                      ) : (
                        conversations.slice(0, 4).map((c) => (
                          <Link
                            key={c.userId}
                            href="/instructor/messages"
                            onClick={() => setMessagesOpen(false)}
                            className="px-4 py-3 flex gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center text-xs font-black shrink-0">
                              {c.avatar}
                            </div>
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <div className="flex justify-between items-baseline">
                                <p className="text-xs font-bold text-zinc-800 dark:text-white truncate">{c.name}</p>
                                <span className="text-[9px] text-zinc-400 font-medium">{c.time}</span>
                              </div>
                              <p className="text-xxs text-zinc-500 dark:text-zinc-400 truncate">{c.preview}</p>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notifications Dropdown */}
            {userId && (
              <div ref={notificationsRef} className="relative">
                <button 
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    if (userId) fetchNotifications(userId);
                  }}
                  className="relative p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full hover:bg-zinc-50 text-zinc-650 dark:text-zinc-300 cursor-pointer flex items-center justify-center"
                >
                  <Bell className="w-5 h-5 text-zinc-500" />
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center border border-white dark:border-zinc-900 animate-pulse">
                      {notifications.filter(n => !n.is_read).length}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-12 w-80 bg-white dark:bg-zinc-900 dark:border-zinc-800 rounded-xl border border-zinc-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">Notifications</p>
                      {notifications.filter(n => !n.is_read).length > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-xxs text-teal-650 hover:text-teal-500 dark:text-teal-400 font-semibold cursor-pointer"
                        >
                          Tout lu
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-zinc-400">
                          Aucune notification
                        </div>
                      ) : (
                        notifications.map((n) => {
                          let IconComponent = Info;
                          let iconColor = "text-blue-500 bg-blue-50 dark:bg-blue-900/10";
                          if (n.type === "SUCCESS") {
                            IconComponent = CheckCircle;
                            iconColor = "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10";
                          } else if (n.type === "WARNING") {
                            IconComponent = AlertTriangle;
                            iconColor = "text-amber-500 bg-amber-50 dark:bg-amber-900/10";
                          } else if (n.type === "ERROR") {
                            IconComponent = XCircle;
                            iconColor = "text-red-500 bg-red-50 dark:bg-red-900/10";
                          }

                          return (
                            <div 
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              className={`px-4 py-3 flex gap-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors ${
                                !n.is_read ? "bg-teal-50/20 dark:bg-teal-900/5 font-medium" : ""
                              }`}
                            >
                              <div className={`p-1.5 rounded-lg shrink-0 h-7 w-7 flex items-center justify-center ${iconColor}`}>
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <p className="text-xs font-semibold text-zinc-955 dark:text-white truncate">{n.title}</p>
                                <p className="text-xxs text-zinc-500 dark:text-zinc-400 line-clamp-2">{n.message}</p>
                                <p className="text-[10px] text-zinc-400 mt-1">{new Date(n.created_at).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
                      <Link
                        href="/instructor/notifications"
                        onClick={() => setNotificationsOpen(false)}
                        className="block py-1.5 text-xxs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 transition-colors"
                      >
                        {language === "en" ? "View all notifications" : "Voir toutes les notifications"}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white leading-none">{session?.name || (language === "en" ? "Instructor" : "Instructeur")}</p>
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
                      {language === "en" ? "My Profile & Academy" : "Mon Profil & Académie"}
                    </Link>
                    {userId && (
                      <Link
                        href={`/profile/${userId}`}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <UserCircle className="w-4 h-4 text-zinc-400" />
                        {language === "en" ? "View my public profile" : "Voir mon profil public"}
                      </Link>
                    )}
                    <button
                      onClick={() => { setProfileOpen(false); setShowPasswordModal(true); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Lock className="w-4 h-4 text-zinc-400" />
                      {language === "en" ? "Change Password" : "Changer le mot de passe"}
                    </button>
                    <Link
                      href="/instructor/billing"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-zinc-400" />
                      {language === "en" ? "My Subscription" : "Mon Abonnement"}
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
                      {language === "en" ? "Log Out" : "Déconnexion"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {unconfirmed && (
          <div className="bg-amber-500 text-white px-6 py-3.5 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300 shrink-0">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 animate-bounce" />
              <p className="text-xs md:text-sm font-semibold">
                {language === "en" ? (
                  <>
                    <strong>Action required:</strong> Please check your email and activate your account within <strong>2 days</strong>. After this limit, your account and data will be deleted.
                  </>
                ) : (
                  <>
                    <strong>Action requise :</strong> Veuillez vérifier vos e-mails et activer votre compte sous un délai de <strong>2 jours</strong>. Passé ce délai, votre compte et vos données seront supprimés.
                  </>
                )}
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
