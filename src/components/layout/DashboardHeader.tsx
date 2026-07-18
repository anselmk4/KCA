"use client";

import { Bell, ChevronDown, Menu, Settings, LogOut, UserCircle, Info, CheckCircle, AlertTriangle, XCircle, Trash2, MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useEffect, useState, useRef } from "react";
import { getSimulatedSession } from "@/lib/rbac";
import { getConversationsForUser } from "@/lib/chat";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
  role?: "student" | "instructor";
}

export function DashboardHeader({ onMenuClick, role = "student" }: DashboardHeaderProps) {
  const { t } = useLanguage();
  const [session, setSession] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      const { supabase } = await import("@/lib/supabase/client");
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
      const { supabase } = await import("@/lib/supabase/client");
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
      const { supabase } = await import("@/lib/supabase/client");
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setNotificationsOpen(false);
      if (notif.link) {
        window.location.href = notif.link;
      }
    } catch (err) {
      console.error("Error clicking notification:", err);
    }
  };

  // Real-time notifications update subscription for student dashboard
  useEffect(() => {
    if (!userId) return;

    fetchNotifications(userId);

    let channel: any;
    const initRealtime = async () => {
      const { supabase } = await import("@/lib/supabase/client");
      channel = supabase
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
    };
    initRealtime();

    return () => {
      if (channel) {
        import("@/lib/supabase/client").then(({ supabase }) => {
          supabase.removeChannel(channel);
        });
      }
    };
  }, [userId]);

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
          fetchNotifications(activeSession.user.id);
          
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
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (messagesRef.current && !messagesRef.current.contains(e.target as Node)) {
        setMessagesOpen(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);

    return () => {
      window.removeEventListener("storage", handler);
      document.removeEventListener("mousedown", clickOutside);
    };
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
    const handleStorage = () => loadConversations();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [session]);

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
    <header className="h-16 bg-white dark:bg-zinc-900 flex items-center justify-between px-4 md:px-8 border-b border-zinc-200 dark:border-white/10 sticky top-0 z-30">
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
                className="relative p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full hover:bg-zinc-50 text-zinc-600 dark:text-zinc-350 cursor-pointer flex items-center justify-center"
              >
                <MessageSquare className="w-4 h-4 text-zinc-500" />
                {conversations.filter(c => c.unreadCount > 0).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center border border-white dark:border-zinc-800 animate-pulse">
                    {conversations.filter(c => c.unreadCount > 0).length}
                  </span>
                )}
              </button>

              {messagesOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white dark:bg-zinc-900 dark:border-zinc-800 rounded-xl border border-zinc-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                  <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">Messages</p>
                    <Link 
                      href={session.role === "INSTRUCTOR" ? "/instructor/messages" : "/dashboard/messages"}
                      onClick={() => setMessagesOpen(false)}
                      className="text-xxs text-blue-600 hover:text-blue-500 dark:text-blue-400 font-semibold cursor-pointer"
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
                          href={session.role === "INSTRUCTOR" ? "/instructor/messages" : "/dashboard/messages"}
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
                className="relative p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full hover:bg-zinc-50 text-zinc-600 dark:text-zinc-300 cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center border border-white dark:border-zinc-800 animate-pulse">
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
                        className="text-xxs text-teal-600 hover:text-teal-500 dark:text-teal-400 font-semibold cursor-pointer"
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
                            className={`px-4 py-3 flex gap-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors ${
                              !n.is_read ? "bg-teal-50/20 dark:bg-teal-900/5 font-medium" : ""
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 h-7 w-7 flex items-center justify-center ${iconColor}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <p className="text-xs font-bold text-zinc-950 dark:text-white leading-normal break-words">{n.title}</p>
                              <p className="text-xxs text-zinc-500 dark:text-zinc-400 leading-relaxed break-words">{n.message}</p>
                              <p className="text-[10px] text-zinc-400 mt-1">{new Date(n.created_at).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="border-t border-zinc-100 dark:border-zinc-800 p-2 text-center">
                    <Link
                      href={role === "instructor" ? "/instructor/notifications" : "/dashboard/notifications"}
                      onClick={() => setNotificationsOpen(false)}
                      className="inline-block text-[11px] font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 transition-colors cursor-pointer w-full py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 rounded-lg"
                    >
                      Voir toutes les notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {session ? (
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
                    <Link href={`/profile/${userId}`} onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
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
          ) : null}
        </div>
      </div>
    </header>
  );
}
